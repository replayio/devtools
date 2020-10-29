import Highlighter from "highlighter/highlighter";
import { ThreadFront } from "protocol/thread";
import { defer, EventEmitter } from "protocol/utils";
import { actions } from "ui/actions";

import { DebuggerPanel } from "devtools/client/debugger/panel";
import { WebConsolePanel } from "devtools/client/webconsole/panel";
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

    EventEmitter.decorate(this);
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
      console: WebConsolePanel,
      inspector: InspectorPanel,
    };

    const panel = new panels[name](this);
    await panel.open();

    this.panels[name] = panel;
    resolve(panel);
    return panel;
  };

  async selectTool(name) {
    let panel = await this.getOrStartPanel(name);

    if (panel.refresh) {
      panel.refresh();
    }

    store.dispatch(actions.setSelectedPanel(name));
    this.emit("select", name);
    return panel;
  }

  toggleSplitConsole(open) {
    store.dispatch(actions.setSplitConsole(open));
  }

  async viewSourceInDebugger(url, line, column, id) {
    const dbg = this.getPanel("debugger");
    const source = id ? dbg.getSourceByActorId(id) : dbg.getSourceByURL(url);
    if (source) {
      store.dispatch(actions.setSelectedPanel("debugger"));
      dbg.selectSource(source.id, line, column);
    }
  }
}
