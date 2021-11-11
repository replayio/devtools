import Highlighter from "highlighter/highlighter";
import { ThreadFront } from "protocol/thread";
import { defer, EventEmitter } from "protocol/utils";
import { actions, UIStore } from "ui/actions";

import { DebuggerPanel } from "devtools/client/debugger/panel";
import { Inspector } from "devtools/client/inspector/inspector";
import Selection from "devtools/client/framework/selection";

export type StartablePanelName = "debugger" | "inspector" | "react-components";

export type PanelName = StartablePanelName | "console" | "comments" | "viewer" | "network";

declare global {
  const store: UIStore;
}

/**
 * Manages the panels that initialization of the developer tools toolbox.
 */
export class DevToolsToolbox {
  panels: Partial<Record<PanelName, any>>;
  panelWaiters: Partial<Record<PanelName, Promise<unknown>>>;
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

  async init(selectedPanel: PanelName) {
    await this.threadFront.initializeToolbox();

    // The debugger has to be started immediately on init so that when we click
    // on any of those messages, either on the console or the timeline, the debugger
    // panel is ready to be opened.
    await this.startPanel("debugger");

    await this.selectTool(selectedPanel);
  }

  getHighlighter() {
    return Highlighter;
  }

  getPanel(name: PanelName) {
    return this.panels[name];
  }

  getOrStartPanel(name: StartablePanelName) {
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
    };

    const panel = new panels[name](this);

    if (name !== "inspector") {
      await (panel as DebuggerPanel).open();
    }

    this.panels[name] = panel;
    store.dispatch(actions.setInitializedPanels(name));

    resolve(panel);
    return panel;
  };

  async selectTool(name: PanelName) {
    // See comments at gToolbox.init(selectedPanel) in DevTools.js
    // for more context. The toolbox needs to be initialized on
    // recordingLoaded however if we start at the "Comments"
    // tab it runs and throws an error at startPanel() above
    // because the comments panel isn't handled by the toolbox
    if (["console", "comments", "viewer", "network"].includes(name)) {
      return;
    }

    let panel = await this.getOrStartPanel(name as StartablePanelName);
    this.emit("select", name);

    this.currentTool = name;
    return panel;
  }

  toggleSplitConsole(open: boolean) {
    store.dispatch(actions.setSplitConsole(open));
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
