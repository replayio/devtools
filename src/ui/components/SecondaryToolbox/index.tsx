import classnames from "classnames";
import React, { ReactNode, Suspense, useContext, useLayoutEffect } from "react";
import { useImperativeCacheValue } from "suspense";

import { EditorPane } from "devtools/client/debugger/src/components/Editor/EditorPane";
import LazyOffscreen from "replay-next/components/LazyOffscreen";
import {
  RecordingCapabilities,
  recordingCapabilitiesCache,
} from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { setSelectedPanel } from "ui/actions/layout";
import { getSelectedPanel, getToolboxLayout } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { SecondaryPanelName } from "ui/state/layout";
import {
  REACT_ANNOTATIONS_COMMIT_KIND,
  REDUX_SETUP_ANNOTATIONS_KIND,
  annotationKindsCache,
} from "ui/suspense/annotationsCaches";
import { trackEvent } from "ui/utils/telemetry";

import { selectors } from "../../reducers";
import NetworkMonitor from "../NetworkMonitor";
import { NodePicker } from "../NodePicker";
import { Redacted } from "../Redacted";
import Loader from "../shared/Loader";
import ReplayLogo from "../shared/ReplayLogo";
import WaitForReduxSlice from "../WaitForReduxSlice";
import NewConsoleRoot from "./NewConsole";
import SourcesTabLabel from "./SourcesTabLabel";

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

const ReactDevToolsPanel = React.lazy(() => import("./ReactDevTools"));

const ReduxDevToolsPanel = React.lazy(() => import("./ReduxDevTools"));

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

function PanelButtons({
  hasReactComponents,
  hasReduxAnnotations,
  recordingCapabilities,
  showDebuggerTab,
}: {
  hasReactComponents: boolean;
  hasReduxAnnotations: boolean;
  recordingCapabilities: RecordingCapabilities;
  showDebuggerTab: boolean;
}) {
  const { supportsElementsInspector, supportsNetworkRequests, supportsRepaintingGraphics } =
    recordingCapabilities;

  const [chromiumNetMonitorEnabled] = useGraphQLUserData("feature_chromiumNetMonitor");
  const [reduxDevToolsEnabled] = useGraphQLUserData("feature_reduxDevTools");

  return (
    <div className="panel-buttons theme-tab-font-size flex flex-row items-center overflow-hidden">
      {supportsRepaintingGraphics && <NodePicker />}
      <PanelButton panel="console">Console</PanelButton>
      {supportsElementsInspector && <PanelButton panel="inspector">Elements</PanelButton>}
      {showDebuggerTab && (
        <PanelButton panel="debugger">
          <SourcesTabLabel />
        </PanelButton>
      )}
      {hasReactComponents && <PanelButton panel="react-components">React</PanelButton>}
      {hasReduxAnnotations && reduxDevToolsEnabled && (
        <PanelButton panel="redux-devtools">Redux</PanelButton>
      )}
      {(chromiumNetMonitorEnabled || supportsNetworkRequests) && (
        <PanelButton panel="network">Network</PanelButton>
      )}
    </div>
  );
}

function ConsolePanel() {
  return (
    <div className="toolbox-bottom-panels">
      <div className={classnames("toolbox-panel")} id="toolbox-content-console">
        <NewConsoleRoot />
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
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  // Don't suspend when waiting for annotations to load
  const { value: hasReactAnnotations = false } = useImperativeCacheValue(
    annotationKindsCache,
    replayClient,
    REACT_ANNOTATIONS_COMMIT_KIND
  );

  const { value: hasReduxAnnotations = false } = useImperativeCacheValue(
    annotationKindsCache,
    replayClient,
    REDUX_SETUP_ANNOTATIONS_KIND
  );

  const chromiumNetMonitorEnabled = useGraphQLUserData("feature_chromiumNetMonitor");
  const recordingCapabilities = recordingCapabilitiesCache.read(replayClient);
  const showDebuggerTab = recordingCapabilities.supportsRepaintingGraphics
    ? toolboxLayout !== "ide"
    : toolboxLayout === "full";

  useLayoutEffect(() => {
    if (selectedPanel === "react-components" && !hasReactAnnotations) {
      dispatch(setSelectedPanel("console"));
    }
  }, [selectedPanel, hasReactAnnotations, dispatch]);

  return (
    <div className={classnames(`secondary-toolbox rounded-lg`)}>
      <header className="secondary-toolbox-header">
        <PanelButtons
          hasReactComponents={hasReactAnnotations}
          hasReduxAnnotations={hasReduxAnnotations}
          recordingCapabilities={recordingCapabilities}
          showDebuggerTab={showDebuggerTab}
        />
        <div className="secondary-toolbox-right-buttons-container flex">
          <PanelButtonsScrollOverflowGradient />
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
          <ReactDevToolsPanel />
        </Panel>
        <Panel isActive={selectedPanel === "redux-devtools"}>
          <ReduxDevToolsPanel />
        </Panel>
        {showDebuggerTab && (
          <Panel isActive={selectedPanel === "debugger"}>
            <EditorPane />
          </Panel>
        )}
      </Redacted>
    </div>
  );
}

function Panel({ children, isActive }: { children: ReactNode; isActive: boolean }) {
  return <LazyOffscreen mode={isActive ? "visible" : "hidden"}>{children}</LazyOffscreen>;
}
