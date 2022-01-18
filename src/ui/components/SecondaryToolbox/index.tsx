import React from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import WebConsoleApp from "devtools/client/webconsole/components/App";

import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";
import ReactDevtoolsPanel from "./ReactDevTools";
import { UIState } from "ui/state";
import { PanelName } from "ui/state/app";
import { isDemo } from "ui/utils/environment";
import { Redacted } from "../Redacted";
import ToolboxOptions from "./ToolboxOptions";
import { trackEvent } from "ui/utils/telemetry";

import "ui/setup/dynamic/inspector";
import { UserSettings } from "ui/types";
import NetworkMonitor from "../NetworkMonitor";
import WaitForReduxSlice from "../WaitForReduxSlice";

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

interface PanelButtonsProps {
  hasReactComponents: boolean;
  isNode: boolean;
  selectedPanel: PanelName;
  setSelectedPanel: (panel: PanelName) => any;
}

function PanelButtons({
  hasReactComponents,
  isNode,
  selectedPanel,
  setSelectedPanel,
}: PanelButtonsProps) {
  const { userSettings } = hooks.useGetUserSettings();
  const { enableNetworkMonitor, showReact, showElements } = userSettings;

  const onClick = (panel: PanelName) => {
    setSelectedPanel(panel);
    trackEvent(`toolbox.secondary.${panel}_select`);

    gToolbox.selectTool(panel);
  };

  return (
    <div className="flex flex-row items-center overflow-hidden theme-tab-font-size">
      {showElements && !isNode && <NodePicker />}
      <button
        className={classnames("console-panel-button", {
          expanded: selectedPanel === "console",
        })}
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
      {enableNetworkMonitor && (
        <button
          className={classnames("console-panel-button", {
            expanded: selectedPanel === "network",
          })}
          onClick={() => onClick("network")}
        >
          <div className="label">Network</div>
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
      <WaitForReduxSlice slice="inspector">
        <React.Suspense fallback={null}>
          <InspectorApp />
        </React.Suspense>
      </WaitForReduxSlice>
    </div>
  );
}

function getAllowedPanels(settings: UserSettings, hasReactComponents: boolean) {
  const allowedPanels = ["console"];
  const { enableNetworkMonitor, showReact, showElements } = settings;

  if (enableNetworkMonitor) {
    allowedPanels.push("network");
  }
  if (showReact && hasReactComponents) {
    allowedPanels.push("react-components");
  }
  if (showElements) {
    allowedPanels.push("inspector");
  }

  return allowedPanels;
}

function SecondaryToolbox({
  selectedPanel,
  setSelectedPanel,
  recordingTarget,
  hasReactComponents,
}: PropsFromRedux) {
  const { userSettings } = hooks.useGetUserSettings();
  const isNode = recordingTarget === "node";

  if (!getAllowedPanels(userSettings, hasReactComponents).includes(selectedPanel)) {
    setSelectedPanel("console");
  }

  return (
    <div className={classnames(`secondary-toolbox rounded-lg`, { node: isNode })}>
      {!isDemo() && (
        <header className="secondary-toolbox-header">
          <PanelButtons
            selectedPanel={selectedPanel}
            setSelectedPanel={setSelectedPanel}
            isNode={isNode}
            hasReactComponents={hasReactComponents}
          />
          <ToolboxOptions />
        </header>
      )}
      <Redacted className="secondary-toolbox-content bg-white text-xs">
        {selectedPanel === "network" && <NetworkMonitor />}
        {selectedPanel === "console" ? <ConsolePanel /> : null}
        {selectedPanel === "inspector" ? <InspectorPanel /> : null}
        {selectedPanel === "react-components" ? <ReactDevtoolsPanel /> : null}
      </Redacted>
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
