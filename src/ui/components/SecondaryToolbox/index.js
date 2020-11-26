import React, { useState } from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import CommentsPanel from "./CommentsPanel";
import WebConsoleApp from "devtools/client/webconsole/components/App";
import InspectorApp from "devtools/client/inspector/components/App";

import "./SecondaryToolbox.css";
import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";

function PanelButtons({ selectedPanel, setSelectedPanel }) {
  const onClick = panel => {
    setSelectedPanel(panel);

    // The comments panel doesn't have to be initialized by the toolbox,
    // only the console and the inspector.
    if (panel !== "comments") {
      gToolbox.selectTool(panel);
    }
  };

  return (
    <div className="panel-buttons">
      <NodePicker />
      <button
        className={classnames("console-panel-button", { expanded: selectedPanel === "console" })}
        onClick={() => onClick("console")}
      >
        Console
      </button>
      <button
        className={classnames("inspector-panel-button", {
          expanded: selectedPanel === "inspector",
        })}
        onClick={() => onClick("inspector")}
      >
        Elements
      </button>
      <button
        className={classnames("comments-panel-button", { expanded: selectedPanel === "comments" })}
        onClick={() => onClick("comments")}
      >
        Comments
      </button>
    </div>
  );
}

function ConsolePanel() {
  return (
    <div className="toolbox-bottom-panels" style={{ overflow: "hidden" }}>
      <div className={classnames("toolbox-panel")} id="toolbox-content-console">
        <WebConsoleApp />
      </div>
    </div>
  );
}

function InspectorPanel({ initializedPanels }) {
  const inspector = gToolbox.getPanel("inspector");
  let markupView, rulesPanel, layoutPanel, computedPanel;

  if (inspector && initializedPanels.includes("inspector")) {
    markupView = inspector._inspector.getPanel("markupview").provider;
    rulesPanel = {
      id: "ruleview",
      title: "Rules",
      panel: inspector._inspector.getPanel("ruleview").provider,
    };
    layoutPanel = {
      id: "layoutview",
      title: "Layout",
      panel: inspector._inspector.getPanel("layoutview").provider,
    };
    computedPanel = {
      id: "computedview",
      title: "Computed",
      panel: inspector._inspector.getPanel("computedview").provider,
    };
  }
  return (
    <div className={classnames("toolbox-panel theme-body")} id="toolbox-content-inspector">
      <InspectorApp
        markupView={markupView}
        rulesPanel={rulesPanel}
        layoutPanel={layoutPanel}
        computedPanel={computedPanel}
      />
      <div id="tabpanels" style={{ display: "none" }}>
        <div id="sidebar-panel-computedview" className="theme-sidebar inspector-tabpanel">
          <div id="computed-toolbar" className="devtools-toolbar devtools-input-toolbar">
            <div className="devtools-searchbox">
              <input
                id="computed-searchbox"
                className="devtools-filterinput"
                type="search"
                placeholder="Filter Styles"
              />
              <button
                id="computed-searchinput-clear"
                className="devtools-searchinput-clear"
              ></button>
            </div>
            <div className="devtools-separator"></div>
            <input id="browser-style-checkbox" type="checkbox" className="includebrowserstyles" />
            <label id="browser-style-checkbox-label" htmlFor="browser-style-checkbox">
              Browser Styles
            </label>
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

function SecondaryToolbox({ initializedPanels, selectedPanel, setSelectedPanel }) {
  return (
    <div className="secondary-toolbox">
      <header className="secondary-toolbox-header">
        <PanelButtons selectedPanel={selectedPanel} setSelectedPanel={setSelectedPanel} />
      </header>
      <div className="secondary-toolbox-content">
        {selectedPanel == "console" ? <ConsolePanel /> : null}
        {selectedPanel == "comments" ? <CommentsPanel /> : null}
        {selectedPanel == "inspector" ? (
          <InspectorPanel initializedPanels={initializedPanels} />
        ) : null}
      </div>
    </div>
  );
}

export default connect(
  state => ({
    initializedPanels: selectors.getInitializedPanels(state),
    selectedPanel: selectors.getSelectedPanel(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel }
)(SecondaryToolbox);
