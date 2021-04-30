import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import Video from "../Video";
import WebConsoleApp from "devtools/client/webconsole/components/App";
import InspectorApp from "devtools/client/inspector/components/App";

import "./SecondaryToolbox.css";
import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";
import { ReactDevtoolsPanel } from "./ReactDevTools";
import { isTest } from "ui/utils/environment";

function PanelButtons({ selectedPanel, setSelectedPanel, narrowMode, isNode }) {
  const userSettings = hooks.useGetUserSettings();

  const showElements = userSettings.showElements || isTest();
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
      {showElements && !isNode && <NodePicker />}
      <button
        className={classnames("console-panel-button", { expanded: selectedPanel === "console" })}
        onClick={() => onClick("console")}
      >
        <div className="label">Console</div>
      </button>
      {showElements && !isNode && (
        <button
          className={classnames("inspector-panel-button", {
            expanded: selectedPanel === "inspector",
          })}
          onClick={() => onClick("inspector")}
        >
          <div className="label">Elements</div>
        </button>
      )}
      {narrowMode && !isNode ? (
        <button
          className={classnames("viewer-panel-button", { expanded: selectedPanel === "viewer" })}
          onClick={() => onClick("viewer")}
        >
          <div className="label">Viewer</div>
        </button>
      ) : null}
      {userSettings.showReact && !isNode && (
        <button
          className={classnames("components-panel-button", {
            expanded: selectedPanel === "react-components",
          })}
          onClick={() => onClick("react-components")}
        >
          <div className="label">⚛️ Components</div>
        </button>
      )}
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

function InspectorPanel() {
  return (
    <div className={classnames("toolbox-panel theme-body")} id="toolbox-content-inspector">
      <InspectorApp />
    </div>
  );
}

function SecondaryToolbox({ selectedPanel, setSelectedPanel, narrowMode, recordingTarget }) {
  const {
    userSettings: { showReact },
  } = hooks.useGetUserSettings();
  const isNode = recordingTarget === "node";
  return (
    <div className={classnames(`secondary-toolbox`, { node: isNode })}>
      <header className="secondary-toolbox-header">
        <PanelButtons
          narrowMode={narrowMode}
          selectedPanel={selectedPanel}
          setSelectedPanel={setSelectedPanel}
          isNode={isNode}
        />
      </header>
      <div className="secondary-toolbox-content">
        {selectedPanel === "console" ? <ConsolePanel /> : null}
        {selectedPanel === "inspector" ? <InspectorPanel /> : null}
        {selectedPanel === "viewer" && narrowMode ? <Video /> : null}
        {showReact && selectedPanel === "react-components" ? <ReactDevtoolsPanel /> : null}
      </div>
    </div>
  );
}

export default connect(
  state => ({
    selectedPanel: selectors.getSelectedPanel(state),
    narrowMode: selectors.getNarrowMode(state),
    recordingTarget: selectors.getRecordingTarget(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel }
)(SecondaryToolbox);
