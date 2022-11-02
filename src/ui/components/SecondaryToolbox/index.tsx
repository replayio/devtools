import "ui/setup/dynamic/inspector";
import classnames from "classnames";
import React, { FC, ReactNode, Suspense, useContext } from "react";

import LazyOffscreen from "bvaughn-architecture-demo/components/LazyOffscreen";
import { EditorPane } from "devtools/client/debugger/src/components/Editor/EditorPane";
import { RecordingCapabilities } from "protocol/thread/thread";
import { setSelectedPanel } from "ui/actions/layout";
import { useFeature } from "ui/hooks/settings";
import { getSelectedPanel, getToolboxLayout } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { SecondaryPanelName, ToolboxLayout } from "ui/state/layout";
import { trackEvent } from "ui/utils/telemetry";

import { selectors } from "../../reducers";
import NetworkMonitor from "../NetworkMonitor";
import { NodePicker } from "../NodePicker";
import { Redacted } from "../Redacted";
import Loader from "../shared/Loader";
import ReplayLogo from "../shared/ReplayLogo";
import WaitForReduxSlice from "../WaitForReduxSlice";
import { getRecordingCapabilitiesSuspense } from "./getRecordingCapabilities";
import NewConsoleRoot from "./NewConsole";
import ReactDevtoolsPanel from "./ReactDevTools";
import { ReduxAnnotationsContext } from "./redux-devtools/redux-annotations";
import { ReduxDevToolsPanel } from "./ReduxDevTools";
import SourcesTabLabel from "./SourcesTabLabel";
import { ShowVideoButton } from "./ToolboxButton";
import ToolboxOptions from "./ToolboxOptions";

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

interface PanelButtonsProps {
  hasReactComponents: boolean;
  hasReduxAnnotations: boolean;
  toolboxLayout: ToolboxLayout;
  recordingCapabilities: RecordingCapabilities;
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
      className={classnames(`relative`, {
        expanded: selectedPanel === panel,
      })}
      data-test-id={`PanelButton-${panel}`}
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
  recordingCapabilities,
}) => {
  const { supportsNetworkRequests, supportsRepaintingGraphics } = recordingCapabilities;
  const { value: chromiumNetMonitorEnabled } = useFeature("chromiumNetMonitor");

  return (
    <div className="panel-buttons theme-tab-font-size flex flex-row items-center overflow-hidden">
      {supportsRepaintingGraphics && <NodePicker />}
      <PanelButton panel="console">Console</PanelButton>
      {supportsRepaintingGraphics && <PanelButton panel="inspector">Elements</PanelButton>}
      {toolboxLayout !== "ide" && (
        <PanelButton panel="debugger">
          <SourcesTabLabel />
        </PanelButton>
      )}
      {hasReactComponents && <PanelButton panel="react-components">React</PanelButton>}
      {hasReduxAnnotations && <PanelButton panel="redux-devtools">Redux</PanelButton>}
      {(chromiumNetMonitorEnabled || supportsNetworkRequests) && (
        <PanelButton panel="network">Network</PanelButton>
      )}
    </div>
  );
};

function ConsolePanel() {
  return (
    <div className="toolbox-bottom-panels">
      <div className={classnames("toolbox-panel")} id="toolbox-content-console">
        <Suspense fallback={<Loader />}>
          <NewConsoleRoot />
        </Suspense>
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

export default function SecondaryToolboxSuspenseWrapper() {
  return (
    <Suspense fallback={<Loader />}>
      <SecondaryToolbox />
    </Suspense>
  );
}

function SecondaryToolbox() {
  const selectedPanel = useAppSelector(getSelectedPanel);
  const hasReactComponents = useAppSelector(selectors.hasReactComponents);
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const reduxAnnotations = useContext(ReduxAnnotationsContext);
  const dispatch = useAppDispatch();

  const recordingCapabilities = getRecordingCapabilitiesSuspense();
  const { value: chromiumNetMonitorEnabled } = useFeature("chromiumNetMonitor");

  if (selectedPanel === "react-components" && !hasReactComponents) {
    dispatch(setSelectedPanel("console"));
  }

  const hasReduxAnnotations = reduxAnnotations.length > 0;

  return (
    <div className={classnames(`secondary-toolbox rounded-lg`)}>
      <header className="secondary-toolbox-header">
        <PanelButtons
          hasReactComponents={hasReactComponents}
          hasReduxAnnotations={hasReduxAnnotations}
          recordingCapabilities={recordingCapabilities}
          toolboxLayout={toolboxLayout}
        />
        <div className="secondary-toolbox-right-buttons-container flex">
          <PanelButtonsScrollOverflowGradient />
          <ShowVideoButton />
          <ToolboxOptions />
        </div>
      </header>
      <Redacted className="secondary-toolbox-content bg-chrome text-xs">
        {(chromiumNetMonitorEnabled || recordingCapabilities.supportsNetworkRequests) && (
          <Panel isActive={selectedPanel === "network"}>
            <NetworkMonitor />
          </Panel>
        )}
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
        {/* _
          Don't_ render an `<Offscreen>` around the editor.
          It appears that this causes React to unmount and remount
          the class components, and we end up with a duplicate
          CodeMirror instance or similar, and the entire editor freezes
          and becomes non-interactive. If we skip that, toggling the "Sources" 
          tab works just fine as expected.
        */}
        {toolboxLayout !== "ide" && selectedPanel === "debugger" && <EditorPane />}
      </Redacted>
    </div>
  );
}

function Panel({ children, isActive }: { children: ReactNode; isActive: boolean }) {
  return <LazyOffscreen mode={isActive ? "visible" : "hidden"}>{children}</LazyOffscreen>;
}
