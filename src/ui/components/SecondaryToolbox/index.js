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

function PanelButtons({ selectedPanel, setSelectedPanel, narrowMode }) {
  const {
    userSettings: { show_elements, show_react },
  } = hooks.useGetUserSettings();

  const showElements = show_elements || isTest();
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
      {showElements && <NodePicker />}
      <button
        className={classnames("console-panel-button", { expanded: selectedPanel === "console" })}
        onClick={() => onClick("console")}
      >
        <div className="label">Console</div>
      </button>
      {showElements && (
        <button
          className={classnames("inspector-panel-button", {
            expanded: selectedPanel === "inspector",
          })}
          onClick={() => onClick("inspector")}
        >
          <div className="label">Elements</div>
        </button>
      )}
      {narrowMode ? (
        <button
          className={classnames("viewer-panel-button", { expanded: selectedPanel === "viewer" })}
          onClick={() => onClick("viewer")}
        >
          <div className="label">Viewer</div>
        </button>
      ) : null}
      {show_react && (
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

function SecondaryToolbox({ selectedPanel, setSelectedPanel, narrowMode }) {
  const {
    userSettings: { show_react },
  } = hooks.useGetUserSettings();
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
        {selectedPanel == "inspector" ? <InspectorPanel /> : null}
        {selectedPanel == "viewer" && narrowMode ? <Video /> : null}
        {show_react && selectedPanel == "react-components" ? <ReactDevtoolsPanel /> : null}
      </div>
    </div>
  );
}

export default connect(
  state => ({
    selectedPanel: selectors.getSelectedPanel(state),
    narrowMode: selectors.getNarrowMode(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel }
)(SecondaryToolbox);
