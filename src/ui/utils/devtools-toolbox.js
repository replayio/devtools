import Highlighter from "highlighter/highlighter";
import { ThreadFront } from "protocol/thread";
import { defer, EventEmitter } from "protocol/utils";
import { actions } from "ui/actions";

import { DebuggerPanel } from "devtools/client/debugger/panel";
import { InspectorPanel } from "devtools/client/inspector/panel";
import Selection from "devtools/client/framework/selection";

/**
 * Manages the panels that initialization of the developer tools toolbox.
 */
export class DevToolsToolbox {
  constructor() {
    this.panels = {};
    this.panelWaiters = {};
    this.threadFront = ThreadFront;
    this.selection = new Selection();
    this.currentTool = null;

    EventEmitter.decorate(this);
  }

  async init(selectedPanel) {
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

  getPanel(name) {
    return this.panels[name];
  }

  getOrStartPanel(name) {
    return this.getPanel(name) || this.startPanel(name);
  }

  startPanel = async name => {
    if (this.panelWaiters[name]) {
      return this.panelWaiters[name];
    }

    const { promise, resolve } = defer();
    this.panelWaiters[name] = promise;

    const panels = {
      debugger: DebuggerPanel,
      inspector: InspectorPanel,
    };

    const panel = new panels[name](this);
    await panel.open();

    this.panels[name] = panel;
    store.dispatch(actions.setInitializedPanels(name));

    resolve(panel);
    return panel;
  };

  async selectTool(name) {
    // See comments at gToolbox.init(selectedPanel) in DevTools.js
    // for more context. The toolbox needs to be initialized on
    // recordingLoaded however if we start at the "Comments"
    // tab it runs and throws an error at startPanel() above
    // because the comments panel isn't handled by the toolbox
    if (["console", "comments", "viewer"].includes(name)) {
      return;
    }

    let panel = await this.getOrStartPanel(name);
    this.emit("select", name);

    this.currentTool = name;
    return panel;
  }

  toggleSplitConsole(open) {
    store.dispatch(actions.setSplitConsole(open));
  }

  async viewSourceInDebugger(url, line, column, id) {
    const dbg = this.getPanel("debugger");
    const source = id ? dbg.getSourceByActorId(id) : dbg.getSourceByURL(url);
    if (source) {
      dbg.selectSource(source.id, line, column);
    }
  }
}
