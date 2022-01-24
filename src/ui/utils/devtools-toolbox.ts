import Highlighter from "highlighter/highlighter";
import { ThreadFront } from "protocol/thread";
import { defer, EventEmitter } from "protocol/utils";
import { actions, UIStore } from "ui/actions";
import { extendStore } from "ui/setup/store";
import * as inspectorReducers from "devtools/client/inspector/reducers";

import { DebuggerPanel } from "devtools/client/debugger/panel";
import { Inspector } from "devtools/client/inspector/inspector";
import Selection from "devtools/client/framework/selection";

export type StartablePanelName = "debugger" | "inspector" | "react-components";

declare global {
  const store: UIStore;
}

type Panels = {
  debugger: DebuggerPanel;
  inspector: Inspector;
  "react-components": any;
  console: any;
  comments: any;
  viewer: any;
  network: any;
};

/**
 * Manages the panels that initialization of the developer tools toolbox.
 */
export class DevToolsToolbox {
  panels: Partial<Panels>;
  panelWaiters: Partial<Record<StartablePanelName, Promise<unknown>>>;
  threadFront: typeof ThreadFront;
  selection: Selection;
  currentTool: string | null;
  timeline?: any;
  nodePicker?: any;

  // added by EventEmitter.decorate(this)
  eventListeners!: Map<string, ((value?: any) => void)[]>;
  on!: (name: string, handler: (value?: any) => void) => void;
  off!: (name: string, handler: (value?: any) => void) => void;
  emit!: (name: string, value?: any) => void;

  constructor() {
    this.panels = {};
    this.panelWaiters = {};
    this.threadFront = ThreadFront;
    this.selection = new Selection();
    this.currentTool = null;

    EventEmitter.decorate(this);
  }

  async init(selectedPanel: StartablePanelName) {
    await this.threadFront.initializeToolbox();

    // The debugger has to be started immediately on init so that when we click
    // on any of those messages, either on the console or the timeline, the debugger
    // panel is ready to be opened.
    await this.startPanel("debugger");

    extendStore(store, {}, inspectorReducers, {});

    await this.selectTool(selectedPanel);
  }

  getHighlighter() {
    return Highlighter;
  }

  getPanel<T extends StartablePanelName>(name: T): Panels[T] | undefined {
    return this.panels[name];
  }

  getOrStartPanel<T extends StartablePanelName>(name: T): Panels[T] | undefined {
    return this.getPanel(name) || this.startPanel(name);
  }

  startPanel = async (name: StartablePanelName) => {
    if (name === "react-components") {
      return;
    }

    if (this.panelWaiters[name]) {
      return this.panelWaiters[name];
    }

    const { promise, resolve } = defer();
    this.panelWaiters[name] = promise;

    const panels = {
      debugger: DebuggerPanel,
      inspector: Inspector,
    } as const;

    const panel = new panels[name](this);

    if (name !== "inspector") {
      await (panel as DebuggerPanel).open();
      this.panels.debugger = panel as DebuggerPanel;
      store.dispatch(actions.setInitializedPanels("debugger"));
    } else {
      this.panels.inspector = panel as Inspector;
      store.dispatch(actions.setInitializedPanels("inspector"));
    }

    resolve(panel);
    return panel;
  };

  async selectTool(name: StartablePanelName) {
    // See comments at gToolbox.init(selectedPanel) in DevTools.js
    // for more context. The toolbox needs to be initialized on
    // recordingLoaded however if we start at the "Comments"
    // tab it runs and throws an error at startPanel() above
    // because the comments panel isn't handled by the toolbox
    if (["console", "comments", "viewer", "network"].includes(name)) {
      return;
    }

    let panel = await this.getOrStartPanel(name);
    this.emit("select", name);

    this.currentTool = name;
    return panel;
  }

  async viewSourceInDebugger(
    url: string | undefined,
    line: number | undefined,
    column: number | undefined,
    id: string | undefined
  ) {
    const dbg = this.getPanel("debugger");
    if (!dbg) {
      return;
    }
    const source = id ? dbg.getSourceByActorId(id) : dbg.getSourceByURL(url);
    if (source) {
      dbg.selectSource(source.id, line, column);
    }
  }
}
