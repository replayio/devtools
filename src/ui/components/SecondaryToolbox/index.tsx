import React from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import WebConsoleApp from "devtools/client/webconsole/components/App";
import MaterialIcon from "ui/components/shared/MaterialIcon";

import "./SecondaryToolbox.css";
import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";
import ReactDevtoolsPanel from "./ReactDevTools";
import { UIState } from "ui/state";
import { PanelName } from "ui/state/app";
import { isDemo } from "ui/utils/environment";

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

interface PanelButtonsProps {
  selectedPanel: PanelName;
  setSelectedPanel: (panel: PanelName) => any;
  isNode: boolean;
  hasReactComponents: boolean;
}

function PanelButtons({
  selectedPanel,
  setSelectedPanel,
  isNode,
  hasReactComponents,
}: PanelButtonsProps) {
  const { userSettings } = hooks.useGetUserSettings();

  const showReact = userSettings.showReact;
  const showElements = userSettings.showElements;

  const onClick = (panel: PanelName) => {
    setSelectedPanel(panel);

    // The comments panel doesn't have to be initialized by the toolbox,
    // only the console and the inspector.
    if (panel !== "comments") {
      gToolbox.selectTool(panel);
    }
  };

  return (
    <div className="flex flex-row items-center overflow-hidden text-sm">
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
      {hasReactComponents && showReact && (
        <button
          className={classnames("components-panel-button", {
            expanded: selectedPanel === "react-components",
          })}
          onClick={() => onClick("react-components")}
        >
          <div className="label">React</div>
        </button>
      )}
    </div>
  );
}

function ConsolePanel() {
  return (
    <div className="toolbox-bottom-panels">
      <div className={classnames("toolbox-panel")} id="toolbox-content-console">
        <WebConsoleApp />
      </div>
    </div>
  );
}

function InspectorPanel() {
  return (
    <div className={classnames("toolbox-panel theme-body")} id="toolbox-content-inspector">
      <React.Suspense fallback={null}>
        <InspectorApp />
      </React.Suspense>
    </div>
  );
}

function SecondaryToolbox({
  selectedPanel,
  setSelectedPanel,
  recordingTarget,
  showVideoPanel,
  setShowVideoPanel,
  hasReactComponents,
}: PropsFromRedux) {
  const { userSettings } = hooks.useGetUserSettings();
  const showReact = userSettings.showReact;
  const isNode = recordingTarget === "node";
  const toggleShowVideoPanel = () => setShowVideoPanel(!showVideoPanel);

  return (
    <div className={classnames(`secondary-toolbox`, { node: isNode })}>
      {!isDemo() && (
        <header className="secondary-toolbox-header">
          <PanelButtons
            selectedPanel={selectedPanel}
            setSelectedPanel={setSelectedPanel}
            isNode={isNode}
            hasReactComponents={hasReactComponents}
          />
          <button className="" onClick={toggleShowVideoPanel}>
            <MaterialIcon className="hover:text-primaryAccent">
              {showVideoPanel ? "videocam_off" : "videocam"}
            </MaterialIcon>
          </button>
        </header>
      )}
      <div className="secondary-toolbox-content text-xs">
        {selectedPanel === "console" ? <ConsolePanel /> : null}
        {selectedPanel === "inspector" ? <InspectorPanel /> : null}
        {showReact && selectedPanel === "react-components" ? <ReactDevtoolsPanel /> : null}
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    selectedPanel: selectors.getSelectedPanel(state),
    recordingTarget: selectors.getRecordingTarget(state),
    showVideoPanel: selectors.getShowVideoPanel(state),
    hasReactComponents: selectors.hasReactComponents(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel, setShowVideoPanel: actions.setShowVideoPanel }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SecondaryToolbox);
