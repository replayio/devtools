import React, { FC } from "react";
import { connect, ConnectedProps } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import WebConsoleApp from "devtools/client/webconsole/components/App";

import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";
import ReactDevtoolsPanel from "./ReactDevTools";
import { UIState } from "ui/state";
import { SecondaryPanelName } from "ui/state/layout";
import { isDemo } from "ui/utils/environment";
import { Redacted } from "../Redacted";
import ToolboxOptions from "./ToolboxOptions";
import { trackEvent } from "ui/utils/telemetry";

import "ui/setup/dynamic/inspector";
import NetworkMonitor from "../NetworkMonitor";
import WaitForReduxSlice from "../WaitForReduxSlice";
import { StartablePanelName } from "ui/utils/devtools-toolbox";
import { compareNumericStrings } from "protocol/utils";

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

interface PanelButtonsProps {
  areReactComponentsReady: boolean;
  hasReactComponents: boolean;
  isNode: boolean;
  selectedPanel: SecondaryPanelName;
  setSelectedPanel: (panel: SecondaryPanelName) => any;
}

const PanelButtons: FC<PanelButtonsProps> = ({
  areReactComponentsReady,
  hasReactComponents,
  isNode,
  selectedPanel,
  setSelectedPanel,
}) => {
  const { userSettings } = hooks.useGetUserSettings();
  const { showReact } = userSettings;

  const onClick = (panel: SecondaryPanelName) => {
    setSelectedPanel(panel);
    trackEvent(`toolbox.secondary.${panel}_select`);

    if (["debugger", "inspector", "react-components"].includes(panel)) {
      gToolbox.selectTool(panel as StartablePanelName);
    }
  };

  return (
    <div className="theme-tab-font-size flex flex-row items-center overflow-hidden">
      {!isNode && <NodePicker />}
      <button
        className={classnames("console-panel-button", {
          expanded: selectedPanel === "console",
        })}
        onClick={() => onClick("console")}
      >
        <div className="label">Console</div>
      </button>
      {!isNode && (
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
          disabled={!areReactComponentsReady}
          className={classnames("components-panel-button", {
            expanded: selectedPanel === "react-components",
          })}
          onClick={() => onClick("react-components")}
          title={!areReactComponentsReady ? "React DevTools not yet initialised." : undefined}
        >
          <div className={classnames("label", { "line-through": !areReactComponentsReady })}>
            React
          </div>
        </button>
      )}
      <button
        className={classnames("console-panel-button", {
          expanded: selectedPanel === "network",
        })}
        onClick={() => onClick("network")}
      >
        <div className="label">Network</div>
      </button>
    </div>
  );
};

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

function SecondaryToolbox({
  selectedPanel,
  setSelectedPanel,
  recordingTarget,
  hasReactComponents,
  firstAnnotation,
  currentPoint,
}: PropsFromRedux) {
  const { userSettings } = hooks.useGetUserSettings();
  const isNode = recordingTarget === "node";

  const areReactComponentsReady =
    firstAnnotation !== null &&
    currentPoint !== null &&
    compareNumericStrings(firstAnnotation, currentPoint) <= 0;

  if (selectedPanel === "react-components" && !(userSettings.showReact && hasReactComponents)) {
    setSelectedPanel("console");
  }

  return (
    <div className={classnames(`secondary-toolbox rounded-lg`, { node: isNode })}>
      {!isDemo() && (
        <header className="secondary-toolbox-header">
          <PanelButtons
            areReactComponentsReady={areReactComponentsReady}
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
    firstAnnotation: selectors.getFirstOpAnnotations(state),
    currentPoint: selectors.getCurrentPoint(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel, setShowVideoPanel: actions.setShowVideoPanel }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SecondaryToolbox);
