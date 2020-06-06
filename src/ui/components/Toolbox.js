/*
BSD 3-Clause License

Copyright (c) 2020, Web Replay LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const React = require("react");
const ReactDOM = require("react-dom");

const { EventEmitter } = require("protocol/utils");
import classnames from "classnames";

import { DebuggerPanel } from "devtools/client/debugger/panel";

const { WebConsolePanel } = require("devtools/client/webconsole/panel");
const { InspectorPanel } = require("devtools/client/inspector/panel");
const Selection = require("devtools/client/framework/selection");
const { log } = require("protocol/socket");
const { defer } = require("protocol/utils");

import Timeline from "./Timeline";
const { ThreadFront } = require("protocol/thread");
const KeyShortcuts = require("devtools/client/shared/key-shortcuts");
import SplitBox from "devtools/client/shared/components/splitter/SplitBox";

import "./Toolbox.css";

const shortcuts = new KeyShortcuts({ window, target: document });

export default class Toolbox extends React.Component {
  state = {
    selectedPanel: "",
    panels: {},
    splitConsoleOpen: true,
  };

  parserService = {
    hasSyntaxError: text => false,
  };

  threadFront = ThreadFront;
  selection = new Selection();
  nodePicker = {};

  panelWaiters = {};

  constructor(props) {
    super(props);
    EventEmitter.decorate(this);
    EventEmitter.decorate(this.nodePicker);
    window.gToolbox = this;
  }

  async componentDidMount() {
    this.props.initialize();

    // Open the console so that the timeline gets events
    this.startPanel("console");

    this.selectTool("debugger");
    shortcuts.on("Esc", this.onEscape);
  }

  get currentTool() {
    return this.state.selectedPanel;
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
    resolve();
  }

  async selectTool(panel) {
    if (panel == this.state.selectedPanel) {
      return;
    }

    if (!this.state.panels[panel]) {
      await this.startPanel(panel);
    }

    log(`Toolbox SelectTool ${panel}`);
    this.setState({ selectedPanel: panel });

    // this.emit("select", panel);
  }

  async viewSourceInDebugger(url, line, column, id) {
    const dbg = this.getPanel("debugger");
    const source = id ? dbg.getSourceByActorId(id) : dbg.getSourceByURL(url);
    if (source) {
      this.selectTool("debugger");
      dbg.selectSource(source.id, line, column);
    }
  }

  onEscape = () => {
    this.toggleSplitConsole(!this.state.splitConsoleOpen);
  };

  getPanel(name) {
    return this.state.panels[name];
  }

  toggleSplitConsole(open) {
    this.setState({ splitConsoleOpen: open });
  }

  getHighlighter() {
    return {};
  }

  renderTimeline() {
    if (!this.getPanel("console")) {
      return null;
    }

    return <Timeline toolbox={this} />;
  }

  renderDebugger() {
    const { panels } = this.state;
    if (!panels.debugger) {
      return null;
    }

    return panels.debugger.renderApp();
  }

  renderInspector() {
    return (
      <div
        className="inspector-responsive-container theme-body inspector"
        data-localization-bundle="devtools/client/locales/inspector.properties"
      >
        {/* <!-- Main Panel Content --> */}
        <div
          id="inspector-main-content"
          className="devtools-main-content"
          style={{ visibility: "hidden" }}
        >
          {/* <!-- Toolbar --> */}
          <div
            id="inspector-toolbar"
            className="devtools-toolbar devtools-input-toolbar"
            nowindowdrag="true"
          >
            <div id="inspector-search" className="devtools-searchbox">
              <input
                id="inspector-searchbox"
                className="devtools-searchinput"
                type="search"
                data-localization="placeholder=inspectorSearchHTML.label3"
              />
              <button
                id="inspector-searchinput-clear"
                className="devtools-searchinput-clear"
                hidden={true}
                tabIndex="-1"
              ></button>
            </div>
            <div id="inspector-searchlabel-container" hidden={true}>
              <div className="devtools-separator"></div>
              <span id="inspector-searchlabel"></span>
            </div>
            <div className="devtools-separator"></div>
            <button
              id="inspector-element-add-button"
              className="devtools-button"
              data-localization="title=inspectorAddNode.label"
              hidden={true}
            ></button>
            <button
              id="inspector-eyedropper-toggle"
              className="devtools-button"
            ></button>
          </div>

          {/* <!-- Markup Container --> */}
          <div id="markup-box" className="theme-body devtools-monospace">
            <div id="markup-root-wrapper" role="presentation">
              <div id="markup-root" role="presentation"></div>
            </div>
            <a id="markup-loading">Loading…</a>
          </div>
          <div id="inspector-breadcrumbs-toolbar" className="devtools-toolbar">
            <div
              id="inspector-breadcrumbs"
              className="breadcrumbs-widget-container"
              role="toolbar"
              data-localization="aria-label=inspector.breadcrumbs.label"
              tabIndex="0"
            ></div>
          </div>
        </div>

        {/* <!-- Splitter --> */}
        <div id="inspector-splitter-box"></div>

        {/* <!-- Split Sidebar Container --> */}
        <div id="inspector-rules-container">
          <div id="inspector-rules-sidebar" hidden={true}></div>
        </div>

        {/* <!-- Sidebar Container --> */}
        <div id="inspector-sidebar-container">
          <div id="inspector-sidebar" hidden={true}></div>
        </div>

        {/* <!-- Sidebar Panel Definitions --> */}
        <div id="tabpanels" style={{ visibility: "collapse" }}>
          <div
            id="sidebar-panel-ruleview"
            className="theme-sidebar inspector-tabpanel"
          >
            <div id="ruleview-toolbar-container">
              <div
                id="ruleview-toolbar"
                className="devtools-toolbar devtools-input-toolbar"
              >
                <div className="devtools-searchbox">
                  <input
                    id="ruleview-searchbox"
                    className="devtools-filterinput"
                    type="search"
                    data-localization="placeholder=inspector.filterStyles.placeholder"
                  />
                  <button
                    id="ruleview-searchinput-clear"
                    className="devtools-searchinput-clear"
                  ></button>
                </div>
                <div className="devtools-separator"></div>
                <div id="ruleview-command-toolbar">
                  <button
                    id="pseudo-class-panel-toggle"
                    data-localization="title=inspector.togglePseudo.tooltip"
                    className="devtools-button"
                    hidden={true}
                  ></button>
                  <button
                    id="class-panel-toggle"
                    data-localization="title=inspector.classPanel.toggleClass.tooltip"
                    className="devtools-button"
                    hidden={true}
                  ></button>
                  <button
                    id="ruleview-add-rule-button"
                    data-localization="title=inspector.addRule.tooltip"
                    className="devtools-button"
                    hidden={true}
                  ></button>
                  <button
                    id="color-scheme-simulation-toggle"
                    data-localization="title=inspector.colorSchemeSimulation.tooltip"
                    className="devtools-button"
                    hidden={true}
                  ></button>
                  <button
                    id="print-simulation-toggle"
                    data-localization="title=inspector.printSimulation.tooltip"
                    className="devtools-button"
                    hidden={true}
                  ></button>
                </div>
              </div>
              <div
                id="pseudo-class-panel"
                className="theme-toolbar ruleview-reveal-panel"
                hidden={true}
              >
                {/* <!-- Populated with checkbox inputs once the Rules view is instantiated --> */}
              </div>
              <div
                id="ruleview-class-panel"
                className="theme-toolbar ruleview-reveal-panel"
                hidden={true}
              ></div>
            </div>

            <div id="ruleview-container" className="ruleview">
              <div id="ruleview-container-focusable" tabIndex="-1"></div>
            </div>
          </div>

          <div
            id="sidebar-panel-computedview"
            className="theme-sidebar inspector-tabpanel"
          >
            <div
              id="computed-toolbar"
              className="devtools-toolbar devtools-input-toolbar"
            >
              <div className="devtools-searchbox">
                <input
                  id="computed-searchbox"
                  className="devtools-filterinput"
                  type="search"
                  data-localization="placeholder=inspector.filterStyles.placeholder"
                />
                <button
                  id="computed-searchinput-clear"
                  className="devtools-searchinput-clear"
                ></button>
              </div>
              <div className="devtools-separator"></div>
              <input
                id="browser-style-checkbox"
                type="checkbox"
                className="includebrowserstyles"
              />
              <label
                id="browser-style-checkbox-label"
                htmlFor="browser-style-checkbox"
                data-localization="content=inspector.browserStyles.label"
              ></label>
            </div>

            <div id="computed-container">
              <div id="computed-container-focusable" tabIndex="-1">
                <div
                  id="computed-property-container"
                  className="devtools-monospace"
                  tabIndex="0"
                  dir="ltr"
                ></div>
                <div
                  id="computed-no-results"
                  className="devtools-sidepanel-no-result"
                  hidden=""
                  data-localization="content=inspector.noProperties"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderToolbar() {
    const { selectedPanel } = this.state;

    return (
      <div id="toolbox-toolbar">
        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPanel == "inspector",
          })}
          id="toolbox-toolbar-inspector"
          onClick={() => this.selectTool("inspector")}
        >
          <div className="toolbar-panel-icon"></div>
          Inspector
        </div>
        <div
          className={classnames("toolbar-panel-button", {
            active: selectedPanel == "debugger",
          })}
          id="toolbox-toolbar-debugger"
          onClick={() => this.selectTool("debugger")}
        >
          <div className="toolbar-panel-icon"></div>
          Debugger
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
    const { selectedPanel, splitConsoleOpen } = this.state;

    if (selectedPanel == "console") {
      return {
        initialSize: "0%",
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
    const { selectedPanel, splitConsoleOpen } = this.state;
    return (
      <div id="toolbox" className={`${selectedPanel}`}>
        <div id="toolbox-border"></div>
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
                  {this.renderDebugger()}
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
              <div
                className="toolbox-bottom-panels"
                style={{ overflow: "hidden" }}
              >
                <div
                  className={classnames("toolbox-panel", {
                    active: selectedPanel == "console" || splitConsoleOpen,
                  })}
                  id="toolbox-content-console"
                />
              </div>
            }
          />
        </div>
      </div>
    );
  }
}
