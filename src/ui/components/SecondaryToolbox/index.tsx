import classnames from "classnames";
import React, { ReactNode, Suspense, useContext, useLayoutEffect } from "react";
import { useImperativeCacheValue } from "suspense";

import { EditorPane } from "devtools/client/debugger/src/components/Editor/EditorPane";
import LazyActivity from "replay-next/components/LazyActivity";
import { PanelLoader } from "replay-next/components/PanelLoader";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { setSelectedPanel } from "ui/actions/layout";
import { getSelectedPanel, getToolboxLayout } from "ui/reducers/layout";
import { getRecordingTooLongToSupportRoutines } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { SecondaryPanelName } from "ui/state/layout";
import {
  REACT_ANNOTATIONS_KIND,
  REACT_SETUP_ANNOTATIONS_KIND,
  REDUX_ANNOTATIONS_KIND,
  REDUX_SETUP_ANNOTATIONS_KIND,
  annotationKindsCache,
} from "ui/suspense/annotationsCaches";
import { trackEvent } from "ui/utils/telemetry";

import { selectors } from "../../reducers";
import NetworkMonitor from "../NetworkMonitor";
import { NodePicker } from "../NodePicker";
import { Redacted } from "../Redacted";
import ReplayLogo from "../shared/ReplayLogo";
import WaitForReduxSlice from "../WaitForReduxSlice";
import NewConsoleRoot from "./NewConsole";
import SourcesTabLabel from "./SourcesTabLabel";
import styles from "./SecondaryToolbox.module.css";

const InspectorApp = React.lazy(() => import("devtools/client/inspector/components/App"));

const ReactDevToolsPanel = React.lazy(() => import("./ReactDevTools"));
const ReduxDevToolsPanel = React.lazy(() => import("./redux-devtools/ReduxDevToolsPanel"));

type RoutinePanelStatus = "pending" | "loaded" | "not-available" | "recording-too-long";

function calculateRoutinePanelStatus(
  hasRoutineAnnotations: boolean,
  hasInitialAnnotations: boolean,
  recordingTooLongForRoutines: boolean
): RoutinePanelStatus {
  // We definitely show these tabs if we have actual annotations from the routine.
  // If we don't have routine annotations, we want to show the tabs anyway _if_ the recording
  // is too long, in which case the panels will show a warning message describing why.
  // Also, we should only show these tabs if we're pretty sure the recording actually has
  // _some_ kind of React or Redux data available (ie, not a Vue or Angular app).
  if (hasRoutineAnnotations) {
    return "loaded";
  } else if (hasInitialAnnotations) {
    // TODO We have no way of knowing routine status right now, so we can't show an error state.

    // We'll never hit this case for Firefox recordings,
    // because we don't have the "initial" annotations from the recording.
    return recordingTooLongForRoutines ? "recording-too-long" : "pending";
  } else {
    return "not-available";
  }
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
        <Suspense fallback={null}>
          <InspectorApp />
        </Suspense>
      </WaitForReduxSlice>
    </div>
  );
}

function RoutinePanelUnavailable({ testId }: { testId: string }) {
  return (
    <div className={styles.CouldNotLoadMessage} data-test-id={testId}>
      <div>Data is unavailable because this recording was too long to process</div>
    </div>
  );
}

export default function SecondaryToolbox() {
  const selectedPanel = useAppSelector(getSelectedPanel);
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const dispatch = useAppDispatch();
  const replayClient = useContext(ReplayClientContext);
  const recordingTooLongForRoutines = useAppSelector(getRecordingTooLongToSupportRoutines);

  // Don't suspend when waiting for annotations to load
  const { value: hasReactRoutineAnnotations = false } = useImperativeCacheValue(
    annotationKindsCache,
    replayClient,
    REACT_ANNOTATIONS_KIND
  );

  const { value: hasReactRecordingAnnotations = false } = useImperativeCacheValue(
    annotationKindsCache,
    replayClient,
    REACT_SETUP_ANNOTATIONS_KIND
  );

  const { value: hasReduxRoutineAnnotations = false } = useImperativeCacheValue(
    annotationKindsCache,
    replayClient,
    REDUX_ANNOTATIONS_KIND
  );

  const { value: hasReduxRecordingAnnotations = false } = useImperativeCacheValue(
    annotationKindsCache,
    replayClient,
    REDUX_SETUP_ANNOTATIONS_KIND
  );

  const chromiumNetMonitorEnabled = useGraphQLUserData("feature_chromiumNetMonitor");

  const recordingCapabilities = recordingCapabilitiesCache.read(replayClient);
  const { supportsElementsInspector, supportsNetworkRequests, supportsRepaintingGraphics } =
    recordingCapabilities;
  const showDebuggerTab = supportsRepaintingGraphics
    ? toolboxLayout !== "ide"
    : toolboxLayout === "full";

  const reactPanelStatus = calculateRoutinePanelStatus(
    hasReactRoutineAnnotations,
    hasReactRecordingAnnotations,
    recordingTooLongForRoutines
  );
  const reduxPanelStatus = calculateRoutinePanelStatus(
    hasReduxRoutineAnnotations,
    hasReduxRecordingAnnotations,
    recordingTooLongForRoutines
  );
  const shouldShowReactTab = reactPanelStatus !== "not-available";
  const shouldShowReduxTab = reduxPanelStatus !== "not-available";

  let reactPanel: React.ReactNode = null;
  let reduxPanel: React.ReactNode = null;

  switch (reactPanelStatus) {
    case "pending":
      reactPanel = <PanelLoader />;
      break;
    case "loaded":
      reactPanel = <ReactDevToolsPanel />;
      break;
    case "recording-too-long":
      reactPanel = <RoutinePanelUnavailable testId="ReactDevToolsPanel" />;
      break;
  }

  switch (reduxPanelStatus) {
    case "pending":
      reduxPanel = <PanelLoader />;
      break;
    case "loaded":
      reduxPanel = <ReduxDevToolsPanel />;
      break;
    case "recording-too-long":
      reduxPanel = <RoutinePanelUnavailable testId="ReduxDevTools" />;
      break;
  }

  const shouldShowNetworkTab =
    chromiumNetMonitorEnabled || recordingCapabilities.supportsNetworkRequests;

  useLayoutEffect(() => {
    // If the selected panel is not available, switch to the console panel.
    if (
      (selectedPanel === "react-components" && !shouldShowReactTab) ||
      (selectedPanel === "redux-devtools" && !shouldShowReduxTab)
    ) {
      dispatch(setSelectedPanel("console"));
    }
  }, [selectedPanel, shouldShowReactTab, shouldShowReduxTab, dispatch]);

  return (
    <div className={classnames(`secondary-toolbox rounded-lg`)}>
      <header className="secondary-toolbox-header">
        <div className="panel-buttons theme-tab-font-size flex flex-row items-center overflow-hidden">
          {supportsRepaintingGraphics && <NodePicker />}
          <PanelButton panel="console">Console</PanelButton>
          {supportsElementsInspector && <PanelButton panel="inspector">Elements</PanelButton>}
          {showDebuggerTab && (
            <PanelButton panel="debugger">
              <SourcesTabLabel />
            </PanelButton>
          )}
          {shouldShowReactTab && <PanelButton panel="react-components">React</PanelButton>}
          {shouldShowReduxTab && <PanelButton panel="redux-devtools">Redux</PanelButton>}
          {shouldShowNetworkTab && <PanelButton panel="network">Network</PanelButton>}
        </div>
        <div className="secondary-toolbox-right-buttons-container flex">
          <div className="secondary-toolbox-scroll-overflow-gradient"></div>
        </div>
      </header>
      <Redacted className="secondary-toolbox-content bg-chrome text-xs">
        <Suspense fallback={<PanelLoader />}>
          {shouldShowNetworkTab && (
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
          <Panel isActive={selectedPanel === "react-components"}>{reactPanel}</Panel>
          <Panel isActive={selectedPanel === "redux-devtools"}>{reduxPanel}</Panel>
          {showDebuggerTab && (
            <Panel isActive={selectedPanel === "debugger"}>
              <EditorPane />
            </Panel>
          )}
        </Suspense>
      </Redacted>
    </div>
  );
}

function Panel({ children, isActive }: { children: ReactNode; isActive: boolean }) {
  return <LazyActivity mode={isActive ? "visible" : "hidden"}>{children}</LazyActivity>;
}
