import { NodeBounds, Object as ProtocolObject } from "@replayio/protocol";
import { createBridge, createStore, initialize } from "@replayio/react-devtools-inline/frontend";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useImperativeCacheValue } from "suspense";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import {
  getExecutionPoint,
  getThreadContext,
  getTime,
} from "devtools/client/debugger/src/reducers/pause";
import { highlightNode, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import ErrorBoundary from "replay-next/components/ErrorBoundary";
import { useIsPointWithinFocusWindow } from "replay-next/src/hooks/useIsPointWithinFocusWindow";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { useNag } from "replay-next/src/hooks/useNag";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { isExecutionPointsLessThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { Nag } from "shared/graphql/types";
import { useTheme } from "shared/theme/useTheme";
import { UIThunkAction } from "ui/actions";
import { fetchMouseTargetsForPause } from "ui/actions/app";
import { enterFocusMode } from "ui/actions/timeline";
import {
  NodeOptsWithoutBounds,
  ReplayWall,
  StoreWithInternals,
} from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";
import { nodePickerDisabled, nodePickerInitializing, nodePickerReady } from "ui/reducers/app";
import { getPreferredLocation } from "ui/reducers/sources";
import { getRecordingMightHaveRoutines } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector, useAppStore } from "ui/setup/hooks";
import { UIState } from "ui/state";
import {
  ParsedReactDevToolsAnnotation,
  reactDevToolsAnnotationsCache,
} from "ui/suspense/annotationsCaches";
import { getMouseTarget } from "ui/suspense/nodeCaches";
import { NodePicker as NodePickerClass, NodePickerOpts } from "ui/utils/nodePicker";

import { ReactDevToolsPanel as NewReactDevtoolsPanel } from "./react-devtools/components/ReactDevToolsPanel";
import { generateTreeResetOpsForPoint } from "./react-devtools/rdtProcessing";
import styles from "./react-devtools/components/ReactDevToolsPanel.module.css";

function jumpToComponentPreferredSource(componentPreview: ProtocolObject): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const cx = getThreadContext(state);
    const location = getPreferredLocation(
      state.sources,
      componentPreview.preview!.functionLocation!
    );
    dispatch(selectLocation(cx, location, true));
  };
}

function createReactDevTools(
  enablePicker: (opts: NodeOptsWithoutBounds) => void,
  initializePicker: () => void,
  disablePicker: () => void,
  highlightNode: (nodeId: string) => void,
  unhighlightNode: () => void,
  setProtocolCheckFailed: (failed: boolean) => void,
  fetchMouseTargetsForPause: () => Promise<NodeBounds[] | undefined>,
  replayClient: ReplayClientInterface,
  dismissInspectComponentNag: () => void
) {
  const target = { postMessage() {} } as unknown as Window;
  const wall = new ReplayWall(
    enablePicker,
    initializePicker,
    disablePicker,
    highlightNode,
    unhighlightNode,
    setProtocolCheckFailed,
    fetchMouseTargetsForPause,
    replayClient,
    dismissInspectComponentNag
  );

  const bridge = createBridge(target, wall);

  // Override shutdown behavior to avoid the RDT UI from closing the bridge connection
  bridge.shutdown = function () {
    // no-op
  };

  const store = createStore(bridge, {
    checkBridgeProtocolCompatibility: false,
    supportsNativeInspection: true,
  });
  wall.store = store as StoreWithInternals;

  const ReactDevTools = initialize(target, { bridge, store });

  return [ReactDevTools, wall, bridge] as const;
}

const nodePickerInstance = new NodePickerClass();

const EMPTY_ANNOTATIONS: ParsedReactDevToolsAnnotation[] = [];

const getIsReactComponentPickerActive = (state: UIState) => {
  const { activeNodePicker, nodePickerStatus } = state.app;
  const isReactComponentPickerActive =
    activeNodePicker === "reactComponent" && nodePickerStatus === "active";
  return isReactComponentPickerActive;
};

export function ReactDevtoolsPanel() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const theme = useTheme();
  const replayClient = useContext(ReplayClientContext);
  const componentPickerActive = useAppSelector(getIsReactComponentPickerActive);
  const currentPoint = useAppSelector(getExecutionPoint);
  const previousPointRef = useRef(currentPoint);
  const currentTime = useAppSelector(getTime);
  const isFirstAnnotationsInjection = useRef(true);
  const [, forceRender] = useReducer(c => c + 1, 0);
  const mightHaveRoutines = useAppSelector(getRecordingMightHaveRoutines);

  const isPointWithinFocusWindow = useIsPointWithinFocusWindow(currentPoint);
  const pauseId = useAppSelector(state => state.pause.id);

  const [, dismissInspectComponentNag] = useNag(Nag.INSPECT_COMPONENT);
  const [protocolCheckFailed, setProtocolCheckFailed] = useState(false);
  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    reactDevToolsAnnotationsCache,
    replayClient
  );

  const showRecordingTooLongWarning = !mightHaveRoutines;

  const annotations: ParsedReactDevToolsAnnotation[] =
    annotationsStatus === "resolved" ? parsedAnnotations : EMPTY_ANNOTATIONS;

  const [ReactDevTools, wall] = useMemo(() => {
    function dispatchHighlightNode(nodeId: string) {
      dispatch(highlightNode(nodeId));
    }

    function dispatchUnhighlightNode() {
      dispatch(unhighlightNode());
    }

    function dispatchFetchMouseTargets() {
      return dispatch(fetchMouseTargetsForPause());
    }

    function enablePicker(opts: NodeOptsWithoutBounds) {
      dispatch(nodePickerReady("reactComponent"));

      const actualOpts: NodePickerOpts = {
        ...opts,
        onCheckNodeBounds: async (x, y, nodeIds) => {
          const boundingRects = await dispatchFetchMouseTargets();
          return getMouseTarget(boundingRects ?? [], x, y, nodeIds);
        },
      };
      nodePickerInstance.enable(actualOpts);
      // HACK There _may_ be an issue with React's `<Offscreen>` and dispatched Redux actions.
      // I can see the "picker active" selector re-running afterwards, but the component doesn't re-render.
      // It seems like it thinks the value is _already_ `true`, when it shouldn't have changed yet.
      // To work around this, we force a re-render of the component after enabling the picker.
      // This is incredibly hacky and I don't feel like it actually _solves_ whatever issue
      // may actually be there... but it does at least let the E2E test pass.
      forceRender();
    }

    function initializePicker() {
      dispatch(nodePickerInitializing("reactComponent"));
    }

    function disablePicker() {
      nodePickerInstance.disable();
      dispatch(nodePickerDisabled());
    }

    const [ReactDevTools, wall, bridge] = createReactDevTools(
      enablePicker,
      initializePicker,
      disablePicker,
      dispatchHighlightNode,
      dispatchUnhighlightNode,
      setProtocolCheckFailed,
      dispatchFetchMouseTargets,
      replayClient,
      dismissInspectComponentNag
    );
    return [ReactDevTools, wall, bridge] as const;
  }, [dispatch, replayClient, dismissInspectComponentNag]);

  useLayoutEffect(() => {
    if (
      !ReactDevTools ||
      !wall ||
      !currentPoint ||
      !pauseId ||
      !annotations ||
      !annotations.length
    ) {
      return;
    }

    wall.setPauseId(pauseId);

    if (previousPointRef.current && previousPointRef.current !== currentPoint) {
      // We keep the one RDT UI component instance alive, but operations are additive over time.
      // In order to reset the displayed component tree, we first need to generate a set of fake
      // "remove this React root" operations based on where we _were_ paused, and inject those.
      const clearTreeOperations = generateTreeResetOpsForPoint(
        previousPointRef.current,
        annotations
      );

      for (const rootRemovalOp of clearTreeOperations) {
        wall.sendAnnotation({ event: "operations", payload: rootRemovalOp });
      }
    }

    if (previousPointRef.current !== currentPoint || isFirstAnnotationsInjection.current) {
      isFirstAnnotationsInjection.current = false;

      // Now that the displayed tree is empty, we can inject all operations up to the _current_ point in time.
      for (const { contents, point } of annotations) {
        if (contents.event === "operations" && isExecutionPointsLessThan(point, currentPoint)) {
          wall.sendAnnotation(contents);
        }
      }
    }

    previousPointRef.current = currentPoint;
  }, [ReactDevTools, wall, currentPoint, annotations, pauseId]);

  useLayoutEffect(() => {
    return () => {
      // If the component picker is active when this tab is hidden, ensure that this
      // is disabled so that we don't interfere with the video or node picker.
      // We specifically do this in a layout effect, so that it happens before
      // the `<InspectHostNodesToggle>` inside the RDT component stops listening
      // for `"stopInspectingNative"` in a `useEffect`.
      if (wall && getIsReactComponentPickerActive(store.getState())) {
        wall.disablePickerParentAndInternal();
      }
    };
  }, [wall, store]);

  useEffect(() => {
    if (wall && currentPoint !== null) {
      // Inject the RDT backend and prefetch node IDs
      wall.setUpRDTInternalsForCurrentPause();
    }
  }, [currentPoint, wall]);

  if (currentPoint === null) {
    return null;
  }

  if (showRecordingTooLongWarning) {
    return (
      <div className={styles.ProtocolFailedPanel} data-test-id="ReactDevToolsPanel">
        <div className={styles.NotMountedYetMessage}>
          <div>
            React components are unavailable because this recording was too long to process them
          </div>
        </div>
      </div>
    );
  }

  if (!isPointWithinFocusWindow) {
    return (
      <div className={styles.ProtocolFailedPanel} data-test-id="ReactDevToolsPanel">
        <div className={styles.NotMountedYetMessage}>
          React components are unavailable because you're paused at a point outside{" "}
          <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusMode())}>
            your debugging window
          </span>
          .
        </div>
      </div>
    );
  }

  if (protocolCheckFailed) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div>React DevTools failed to init.</div>
        <div>
          Try picking a different point on the timeline or reloading the page. If the problem
          persists, try creating a new recording with the latest version of the Replay browser.
        </div>
      </div>
    );
  }

  const firstOperation = annotations.find(annotation => annotation.contents.event == "operations");
  const reactInitPoint = firstOperation?.point ?? null;

  const isReactDevToolsReady = ReactDevTools !== null && wall !== null;
  const isReady =
    isReactDevToolsReady &&
    reactInitPoint !== null &&
    currentPoint !== null &&
    isExecutionPointsLessThan(reactInitPoint, currentPoint);

  if (!isReady) {
    return (
      <div className="flex grow flex-col items-center justify-center gap-4 p-4">
        <img src="/images/react.svg" className="mt-2 w-8" />
        {isReactDevToolsReady ? (
          <>
            <div>Mounting your React application...</div>
            <div>Try picking a different point on the timeline.</div>
          </>
        ) : (
          <div>Loading React Developer Tools...</div>
        )}
      </div>
    );
  }

  return (
    <>
      <ReactDevTools
        browserTheme={theme}
        enabledInspectedElementContextMenu={false}
        overrideTab="components"
        showTabBar={false}
        readOnly={true}
        hideSettings={true}
        hideToggleErrorAction={true}
        hideToggleSuspenseAction={true}
        hideLogAction={true}
        viewElementSourceFunction={async (id, inspectedElement) => {
          const componentPreview = await wall.getComponentLocation(id);
          if (componentPreview?.preview?.functionLocation) {
            dispatch(jumpToComponentPreferredSource(componentPreview));
          }
        }}
      />
      {/* Solely for E2E test usage - need to track our app picker status vs internal RDT status*/}
      <span
        data-test-name="ReactPanelPickerStatus"
        data-component-picker-active={`${componentPickerActive}`}
      />
    </>
  );
}

export default function ReactDevToolsWithErrorBoundary() {
  const replayClient = useContext(ReplayClientContext);
  const { point, pauseId } = useMostRecentLoadedPause() ?? {};

  const recordingCapabilities = recordingCapabilitiesCache.read(replayClient);

  // The new React DevTools depends on recently-added Chromium only Replay APIs
  // For now, fall back to the old RDT for older Chrome or Firefox recordings
  const showNewDevTools = recordingCapabilities.supportsObjectIdLookupsInEvaluations;

  return (
    <ErrorBoundary name="ReactDevTools" resetKey={pauseId ?? ""}>
      {showNewDevTools ? (
        <NewReactDevtoolsPanel executionPoint={point ?? null} pauseId={pauseId ?? null} />
      ) : (
        <ReactDevtoolsPanel />
      )}
    </ErrorBoundary>
  );
}
