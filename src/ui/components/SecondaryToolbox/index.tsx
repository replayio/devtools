import LazyOffscreen from "@bvaughn/components/LazyOffscreen";
import React, { FC, ReactNode, useContext } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import classnames from "classnames";
import WebConsoleApp from "devtools/client/webconsole/components/App";

import NodePicker from "../NodePicker";
import { selectors } from "../../reducers";
import ReactDevtoolsPanel from "./ReactDevTools";
import { ReduxDevToolsPanel } from "./ReduxDevTools";

import { SecondaryPanelName, ToolboxLayout } from "ui/state/layout";
import { Redacted } from "../Redacted";
import ToolboxOptions from "./ToolboxOptions";
import { EditorPane } from "devtools/client/debugger/src/components/Editor/EditorPane";

import { trackEvent } from "ui/utils/telemetry";

import "ui/setup/dynamic/inspector";
import NetworkMonitor from "../NetworkMonitor";
import WaitForReduxSlice from "../WaitForReduxSlice";
import ReplayLogo from "../shared/ReplayLogo";
import { getSelectedPanel, getToolboxLayout } from "ui/reducers/layout";
import { ShowVideoButton } from "./ToolboxButton";
import SourcesTabLabel from "./SourcesTabLabel";
import { setSelectedPanel } from "ui/actions/layout";
import { getRecordingTarget } from "ui/reducers/app";
import { ReduxAnnotationsContext } from "./redux-devtools/redux-annotations";

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

interface PanelButtonsProps {
  hasReactComponents: boolean;
  hasReduxAnnotations: boolean;
  toolboxLayout: ToolboxLayout;
  isNode: boolean;
}

interface PanelButtonProps {
  panel: SecondaryPanelName;
  children?: React.ReactNode;
}

const PanelButton = ({ panel, children }: PanelButtonProps) => {
  const selectedPanel = useAppSelector(selectors.getSelectedPanel);
  const dispatch = useAppDispatch();

  const onClick = (panel: SecondaryPanelName) => {
    dispatch(setSelectedPanel(panel));
    trackEvent(`toolbox.secondary.${panel}_select`);
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

const PanelButtons: FC<PanelButtonsProps> = ({
  hasReactComponents,
  hasReduxAnnotations,
  toolboxLayout,
  isNode,
}) => {
  return (
    <div className="panel-buttons theme-tab-font-size flex flex-row items-center overflow-hidden">
      {!isNode && <NodePicker />}
      <PanelButton panel="console">Console</PanelButton>
      {!isNode && <PanelButton panel="inspector">Elements</PanelButton>}
      {toolboxLayout !== "ide" && (
        <PanelButton panel="debugger">
          <SourcesTabLabel />
        </PanelButton>
      )}
      {hasReactComponents && <PanelButton panel="react-components">React</PanelButton>}
      {hasReduxAnnotations && <PanelButton panel="redux-devtools">Redux</PanelButton>}
      <PanelButton panel="network">Network</PanelButton>
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

function PanelButtonsScrollOverflowGradient() {
  return <div className="secondary-toolbox-scroll-overflow-gradient"></div>;
}

export default function SecondaryToolbox() {
  const selectedPanel = useAppSelector(getSelectedPanel);
  const recordingTarget = useAppSelector(getRecordingTarget);
  const hasReactComponents = useAppSelector(selectors.hasReactComponents);
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const reduxAnnotations = useContext(ReduxAnnotationsContext);
  const dispatch = useAppDispatch();
  const isNode = recordingTarget === "node";

  if (selectedPanel === "react-components" && !hasReactComponents) {
    dispatch(setSelectedPanel("console"));
  }

  const hasReduxAnnotations = reduxAnnotations.length > 0;

  return (
    <div className={classnames(`secondary-toolbox rounded-lg`, { node: isNode })}>
      <header className="secondary-toolbox-header">
        <PanelButtons
          isNode={isNode}
          hasReactComponents={hasReactComponents}
          hasReduxAnnotations={hasReduxAnnotations}
          toolboxLayout={toolboxLayout}
        />
        <div className="secondary-toolbox-right-buttons-container flex">
          <PanelButtonsScrollOverflowGradient />
          <ShowVideoButton />
          <ToolboxOptions />
        </div>
      </header>
      <Redacted className="secondary-toolbox-content bg-chrome text-xs">
        <Panel isActive={selectedPanel === "network"}>
          <NetworkMonitor />
        </Panel>
        <Panel isActive={selectedPanel === "console"}>
          <ConsolePanel />
        </Panel>
        <Panel isActive={selectedPanel === "inspector"}>
          <InspectorPanel />
        </Panel>
        <Panel isActive={selectedPanel === "react-components"}>
          <ReactDevtoolsPanel />
        </Panel>
        <Panel isActive={selectedPanel === "redux-devtools"}>
          <ReduxDevToolsPanel />
        </Panel>
        <Panel isActive={toolboxLayout !== "ide" && selectedPanel === "debugger"}>
          <EditorPane />
        </Panel>
      </Redacted>
    </div>
  );
}

function Panel({ children, isActive }: { children: ReactNode; isActive: boolean }) {
  return <LazyOffscreen mode={isActive ? "visible" : "hidden"}>{children}</LazyOffscreen>;
}
