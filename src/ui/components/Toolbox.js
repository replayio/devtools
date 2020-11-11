import React from "react";

import { EventEmitter } from "protocol/utils";
import classnames from "classnames";

import Selection from "devtools/client/framework/selection";
import { log } from "protocol/socket";
import { defer } from "protocol/utils";
import Highlighter from "highlighter/highlighter";
import DebuggerApp from "devtools/client/debugger/src/components/App";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";
import { DebuggerPanel } from "devtools/client/debugger/panel";
import { WebConsolePanel } from "devtools/client/webconsole/panel";
import { InspectorPanel } from "devtools/client/inspector/panel";
import InspectorApp from "devtools/client/inspector/components/App";
import WebConsoleApp from "devtools/client/webconsole/components/App";

import Timeline from "./Timeline";
import NodePicker from "./NodePicker";
import { ThreadFront } from "protocol/thread";
import { connect } from "react-redux";
import { actions } from "../actions";
import { selectors } from "../reducers";

import { LocalizationHelper } from "devtools/shared/l10n";
const INSPECTOR_L10N = new LocalizationHelper("devtools/client/locales/inspector.properties");
const Services = require("Services");

import "./Toolbox.css";

const shortcuts = new KeyShortcuts({ window, target: document });

class Toolbox extends React.Component {
  state = {
    panels: {},
  };

  threadFront = ThreadFront;
  selection = new Selection();

  panelWaiters = {};

  constructor(props) {
    super(props);
    EventEmitter.decorate(this);

    window.gToolbox = this;
  }

  async componentDidMount() {
    const { selectedPanel } = this.props;

    this.threadFront.initializeToolbox();
    // Open the console so that the timeline gets events
    this.startPanel("console");
    this.selectTool(selectedPanel);
    shortcuts.on("Esc", this.onEscape);
  }

  get currentTool() {
    return this.props.selectedPanel;
  }

  async startPanel(name) {
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

    this.setState({ panels: { ...this.state.panels, [name]: panel } });
    resolve(panel);
    return panel;
  }

  getOrStartPanel(name) {
    return this.getPanel(name) || this.startPanel(name);
  }

  async selectTool(name) {
    const { selectedPanel, setSelectedPanel } = this.props;
    let panel = this.state.panels[name];

    if (panel && name == selectedPanel) {
      return panel;
    }

    log(`Toolbox SelectTool ${name}`);
    setSelectedPanel(name);

    if (!panel) {
      panel = await this.startPanel(name);
    }

    if (panel.refresh) {
      panel.refresh();
    }

    this.emit("select", name);
    return panel;
  }

  async viewSourceInDebugger(url, line, column, id) {
    const dbg = this.getPanel("debugger");
    const source = id ? dbg.getSourceByActorId(id) : dbg.getSourceByURL(url);
    if (source) {
      this.selectTool("debugger");
      dbg.selectSource(source.id, line, column);
    }
  }

  onEscape = e => {
    if (e.cancelBubble) {
      return;
    }

    this.toggleSplitConsole(!this.props.splitConsoleOpen);
  };

  getPanel(name) {
    return this.state.panels[name];
  }

  toggleSplitConsole(open) {
    this.props.setSplitConsole(open);
  }

  getHighlighter() {
    return Highlighter;
  }

  renderTimeline() {
    if (!this.getPanel("console")) {
      return null;
    }

    return <Timeline toolbox={this} />;
  }

  renderInspector() {
    const inspector = this.getPanel("inspector");
    let markupView;
    let rulesPanel;
    let layoutPanel;
    if (inspector) {
      markupView = inspector._inspector.getPanel("markupview").provider;
      rulesPanel = {
        id: "newruleview",
        title: INSPECTOR_L10N.getStr("inspector.sidebar.ruleViewTitle"),
        panel: inspector._inspector.getPanel("newruleview").provider,
      };
      layoutPanel = {
        id: "layoutview",
        title: INSPECTOR_L10N.getStr("inspector.sidebar.layoutViewTitle2"),
        panel: inspector._inspector.getPanel("layoutview").provider,
      };
    }
    return (
      <InspectorApp markupView={markupView} rulesPanel={rulesPanel} layoutPanel={layoutPanel} />
    );
  }

  renderToolbar() {
    const { selectedPanel } = this.props;

    return (
      <div id="toolbox-toolbar">
        <NodePicker toolbox={this} />
        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPanel == "inspector",
          })}
          id="toolbox-toolbar-inspector"
          onClick={() => this.selectTool("inspector")}
        >
          <div className="toolbar-panel-icon"></div>
          Elements
        </div>
        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPanel == "debugger",
          })}
          id="toolbox-toolbar-debugger"
          onClick={() => this.selectTool("debugger")}
        >
          <div className="toolbar-panel-icon"></div>
          Sources
        </div>
        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPanel == "console",
          })}
          id="toolbox-toolbar-console"
          onClick={() => this.selectTool("console")}
        >
          <div className="toolbar-panel-icon"></div>
          Console
        </div>
      </div>
    );
  }

  getSplitBoxDimensions() {
    const { selectedPanel, splitConsoleOpen } = this.props;

    if (selectedPanel == "console") {
      // We intentionally don't pass in the `initialSize: "0%"` here. This is
      // important for when the split console is open, and we switch panels from
      // uncontrolled (console) to controlled (debugger/inspector). This way, the
      // controlled height is not stuck at 0% until we resize the panel manually.
      return {
        minSize: 0,
        maxSize: 0,
      };
    }

    if (splitConsoleOpen) {
      return {
        initialSize: "50%",
        minSize: "0%",
        maxSize: "100%",
      };
    }

    return {
      initialSize: "50%",
      minSize: "100%",
      maxSize: "100%",
    };
  }

  render() {
    const { selectedPanel, splitConsoleOpen } = this.props;
    return (
      <div id="toolbox" className={`${selectedPanel}`}>
        <div id="toolbox-timeline">{this.renderTimeline()}</div>
        {this.renderToolbar()}
        <div
          id="toolbox-contents"
          className={classnames("", {
            splitConsole: selectedPanel != "console" && splitConsoleOpen,
          })}
        >
          <SplitBox
            style={{ width: "100vw", overflow: "hidden" }}
            {...this.getSplitBoxDimensions()}
            splitterSize={1}
            vert={false}
            onResizeEnd={num => {}}
            startPanel={
              <div className="toolbox-top-panels">
                <div
                  className={classnames("toolbox-panel", {
                    active: selectedPanel == "debugger",
                  })}
                  id="toolbox-content-debugger"
                >
                  <DebuggerApp />
                </div>
                <div
                  className={classnames("toolbox-panel theme-body", {
                    active: selectedPanel == "inspector",
                  })}
                  id="toolbox-content-inspector"
                >
                  {this.renderInspector()}
                </div>
              </div>
            }
            endPanelControl={false}
            endPanel={
              <div className="toolbox-bottom-panels" style={{ overflow: "hidden" }}>
                <div
                  className={classnames("toolbox-panel", {
                    active: selectedPanel == "console" || splitConsoleOpen,
                  })}
                  id="toolbox-content-console"
                >
                  <WebConsoleApp />
                </div>
              </div>
            }
          />
        </div>
      </div>
    );
  }
}
export default connect(
  state => ({
    selectedPanel: selectors.getSelectedPanel(state),
    splitConsoleOpen: selectors.isSplitConsoleOpen(state),
  }),
  {
    setSplitConsole: actions.setSplitConsole,
    setSelectedPanel: actions.setSelectedPanel,
  }
)(Toolbox);
