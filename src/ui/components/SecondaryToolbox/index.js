import React, { useEffect } from "react";
import { connect } from "react-redux";
import classnames from "classnames";

import CommentsPanel from "./CommentsPanel";
import WebConsoleApp from "devtools/client/webconsole/components/App";
import InspectorApp from "devtools/client/inspector/components/App";
import MarkupApp from "devtools/client/inspector/markup/components/MarkupApp";
const RulesApp = require("devtools/client/inspector/rules/components/RulesApp");
import ComputedApp from "devtools/client/inspector/computed/components/ComputedApp";
const LayoutApp = require("devtools/client/inspector/layout/components/LayoutApp");

import "./SecondaryToolbox.css";
import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";
import { installObserver } from "../../../protocol/graphics";

function PanelButtons({ selectedPanel, setSelectedPanel, narrowMode }) {
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
        <div className="img new-panel-console" />
        <div className="label">Console</div>
      </button>
      <button
        className={classnames("inspector-panel-button", {
          expanded: selectedPanel === "inspector",
        })}
        onClick={() => onClick("inspector")}
      >
        <div className="img new-panel-elements" />
        <div className="label">Elements</div>
      </button>
      <button
        className={classnames("comments-panel-button", { expanded: selectedPanel === "comments" })}
        onClick={() => onClick("comments")}
      >
        <div className="img new-panel-transcript" />
        <div className="label">Transcript and Comments</div>
      </button>
      {narrowMode ? (
        <button
          className={classnames("viewer-panel-button", { expanded: selectedPanel === "viewer" })}
          onClick={() => onClick("viewer")}
        >
          <div className="img new-panel-viewer" />
          <div className="label">Viewer</div>
        </button>
      ) : null}
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
    markupView = <MarkupApp inspector={inspector._inspector} />;
    rulesPanel = {
      id: "ruleview",
      title: "Rules",
      panel: <RulesApp {...inspector._inspector.rules.getRulesProps()} />,
    };
    const layoutProps = {
      ...inspector._inspector.getCommonComponentProps(),
      ...inspector._inspector.boxModel.getComponentProps(),
      showBoxModelProperties: true,
    };
    layoutPanel = {
      id: "layoutview",
      title: "Layout",
      panel: <LayoutApp {...layoutProps} />,
    };
    computedPanel = {
      id: "computedview",
      title: "Computed",
      panel: <ComputedApp />,
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
    </div>
  );
}

function ViewerPanel() {
  useEffect(() => {
    installObserver();
  }, []);

  return (
    <div id="outer-viewer" style={{ height: "100%" }}>
      <div id="viewer">
        <canvas id="graphics"></canvas>
        <div id="highlighter-root"></div>
      </div>
    </div>
  );
}

function SecondaryToolbox({ initializedPanels, selectedPanel, setSelectedPanel, narrowMode }) {
  return (
    <div className="secondary-toolbox">
      <header className="secondary-toolbox-header">
        <PanelButtons
          narrowMode={narrowMode}
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
        />
      </header>
      <div className="secondary-toolbox-content">
        {selectedPanel == "console" ? <ConsolePanel /> : null}
        {selectedPanel == "comments" ? <CommentsPanel /> : null}
        {selectedPanel == "inspector" ? (
          <InspectorPanel initializedPanels={initializedPanels} />
        ) : null}
        {selectedPanel == "viewer" && narrowMode ? <ViewerPanel /> : null}
      </div>
    </div>
  );
}

export default connect(
  state => ({
    initializedPanels: selectors.getInitializedPanels(state),
    selectedPanel: selectors.getSelectedPanel(state),
    narrowMode: selectors.getNarrowMode(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel }
)(SecondaryToolbox);
