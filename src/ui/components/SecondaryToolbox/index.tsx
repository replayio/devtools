import React, { FC } from "react";
import { connect, ConnectedProps, useDispatch, useSelector } from "react-redux";
import classnames from "classnames";
import hooks from "ui/hooks";
import WebConsoleApp from "devtools/client/webconsole/components/App";

import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import { actions } from "../../actions";
import ReactDevtoolsPanel from "./ReactDevTools";
import { UIState } from "ui/state";
import { SecondaryPanelName, ToolboxLayout } from "ui/state/layout";
import { Redacted } from "../Redacted";
import ToolboxOptions from "./ToolboxOptions";
import { EditorPane } from "devtools/client/debugger/src/components/Editor/EditorPane";

import { trackEvent } from "ui/utils/telemetry";

import "ui/setup/dynamic/inspector";
import NetworkMonitor from "../NetworkMonitor";
import WaitForReduxSlice from "../WaitForReduxSlice";
import { StartablePanelName } from "ui/utils/devtools-toolbox";
import ReplayLogo from "../shared/ReplayLogo";
import { getShowVideoPanel } from "ui/reducers/layout";
import { ShowVideoButton } from "./ToolboxButton";
import SourcesTabLabel from "./SourcesTabLabel";
import { setSelectedPanel } from "ui/actions/layout";

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

interface PanelButtonsProps {
  hasReactComponents: boolean;
  toolboxLayout: ToolboxLayout;
  isNode: boolean;
}

interface PanelButtonProps {
  panel: SecondaryPanelName;
  label: string;
}

const PanelButton: FC<PanelButtonProps> = ({ panel, label, children }) => {
  const selectedPanel = useSelector(selectors.getSelectedPanel);
  const dispatch = useDispatch();

  const onClick = (panel: SecondaryPanelName) => {
    dispatch(setSelectedPanel(panel));
    trackEvent(`toolbox.secondary.${panel}_select`);

    if (["debugger", "inspector", "react-components"].includes(panel)) {
      gToolbox.selectTool(panel as StartablePanelName);
    }
  };

  return (
    <button
      className={classnames(`${panel}-panel-button relative`, {
        expanded: selectedPanel === panel,
      })}
      onClick={() => onClick(panel)}
    >    
      <div className="label">{children}</div>
    </button>
  );
};

const PanelButtons: FC<PanelButtonsProps> = ({ hasReactComponents, toolboxLayout, isNode }) => {
  const { userSettings } = hooks.useGetUserSettings();
  const { showReact } = userSettings;

  return (
    <div className="panel-buttons theme-tab-font-size flex flex-row items-center overflow-hidden">
      {!isNode && <NodePicker />}
      
      <PanelButton panel="console">
        Console
      </PanelButton>
      
      {!isNode &&
        <PanelButton panel="inspector">
        Elements
      </PanelButton>}
      
      {toolboxLayout !== "ide" &&
      <PanelButton panel="debugger">
        <SourcesTabLabel />
      </PanelButton>
      }
      
      {hasReactComponents && showReact &&
      <PanelButton panel="react-components">
        React
      </PanelButton>
      }
      
      <PanelButton panel="network">
        Network
      </PanelButton>
      
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
      <WaitForReduxSlice
        slice="inspector"
        loading={
          <div className="align-center m-auto flex w-full justify-center">
            <div className="relative flex w-96 flex-col items-center rounded-lg bg-white/75 p-8 py-4">
              <ReplayLogo wide size="lg" />
              <div>Inspector is loading...</div>
            </div>
          </div>
        }
      >
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
  toolboxLayout,
  recordingTarget,
  hasReactComponents,
}: PropsFromRedux) {
  const showVideoPanel = useSelector(getShowVideoPanel);
  const { userSettings } = hooks.useGetUserSettings();
  const isNode = recordingTarget === "node";

  if (selectedPanel === "react-components" && !(userSettings.showReact && hasReactComponents)) {
    setSelectedPanel("console");
  }

  return (
    <div className={classnames(`secondary-toolbox rounded-lg`, { node: isNode })}>
      <header className="secondary-toolbox-header">
        <PanelButtons
          isNode={isNode}
          hasReactComponents={hasReactComponents}
          toolboxLayout={toolboxLayout}
        />
        <div className="flex">
          {!showVideoPanel || true ? <ShowVideoButton /> : null}
          <ToolboxOptions />
        </div>
      </header>
      <Redacted className="secondary-toolbox-content bg-chrome text-xs">
        {selectedPanel === "network" && <NetworkMonitor />}
        {selectedPanel === "console" ? <ConsolePanel /> : null}
        {selectedPanel === "inspector" ? <InspectorPanel /> : null}
        {selectedPanel === "react-components" ? <ReactDevtoolsPanel /> : null}
        {toolboxLayout !== "ide" && selectedPanel === "debugger" ? (
          <EditorPane toolboxLayout={toolboxLayout} />
        ) : null}
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
    toolboxLayout: selectors.getToolboxLayout(state),
  }),
  { setSelectedPanel: actions.setSelectedPanel, setShowVideoPanel: actions.setShowVideoPanel }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(SecondaryToolbox);
