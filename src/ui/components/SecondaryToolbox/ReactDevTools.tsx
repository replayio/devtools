import { NodeBounds, Object as ProtocolObject } from "@replayio/protocol";
import type { SerializedElement, Store, Wall } from "@replayio/react-devtools-inline/frontend";
import React, {
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
import { getThreadContext } from "devtools/client/debugger/src/reducers/pause";
import { highlightNode, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";
import ErrorBoundary from "replay-next/components/ErrorBoundary";
import { useIsPointWithinFocusWindow } from "replay-next/src/hooks/useIsPointWithinFocusWindow";
import { useNag } from "replay-next/src/hooks/useNag";
import { recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { evaluate } from "replay-next/src/utils/evaluate";
import { recordData } from "replay-next/src/utils/telemetry";
import { isExecutionPointsLessThan } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { Nag } from "shared/graphql/types";
import { useTheme } from "shared/theme/useTheme";
import { UIThunkAction } from "ui/actions";
import { fetchMouseTargetsForPause } from "ui/actions/app";
import { enterFocusMode } from "ui/actions/timeline";
import {
  getCurrentPoint,
  nodePickerDisabled,
  nodePickerInitializing,
  nodePickerReady,
} from "ui/reducers/app";
import { getPreferredLocation } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector, useAppStore } from "ui/setup/hooks";
import { UIState } from "ui/state";
import {
  ParsedReactDevToolsAnnotation,
  reactDevToolsAnnotationsCache,
} from "ui/suspense/annotationsCaches";
import { getMouseTarget } from "ui/suspense/nodeCaches";
import { NodePicker as NodePickerClass, NodePickerOpts } from "ui/utils/nodePicker";
import { getJSON } from "ui/utils/objectFetching";
import { sendTelemetryEvent, trackEvent } from "ui/utils/telemetry";

import {
  injectReactDevtoolsBackend,
  nodesToFiberIdsCache,
} from "./react-devtools/injectReactDevtoolsBackend";
import { generateTreeResetOpsForPoint } from "./react-devtools/rdtProcessing";

type ReactDevToolsInlineModule = typeof import("@replayio/react-devtools-inline/frontend");

type NodeOptsWithoutBounds = Omit<NodePickerOpts, "onCheckNodeBounds">;

// Some internal values not currently included in `@types/react-devtools-inline`
type ElementWithChildren = SerializedElement & {
  children: number[];
};

type StoreWithInternals = Store & {
  _idToElement: Map<number, ElementWithChildren>;
};

// used by the frontend to communicate with the backend
class ReplayWall implements Wall {
  private _listener?: (msg: any) => void;
  private inspectedElements = new Set();
  private highlightedElementId?: number;
  store?: StoreWithInternals;
  pauseId?: string;

  constructor(
    private enablePicker: (opts: NodeOptsWithoutBounds) => void,
    private initializePicker: () => void,
    public disablePickerInParentPanel: () => void,
    private highlightNode: (nodeId: string) => void,
    private unhighlightNode: () => void,
    private setProtocolCheckFailed: (failed: boolean) => void,
    private fetchMouseTargetsForPause: () => Promise<NodeBounds[] | undefined>,
    private replayClient: ReplayClientInterface,
    private dismissInspectComponentNag: () => void
  ) {}

  setPauseId(pauseId: string) {
    this.pauseId = pauseId;
    this.inspectedElements.clear();
  }

  // called by the frontend to register a listener for receiving backend messages
  listen(listener: (msg: any) => void) {
    this._listener = msg => {
      try {
        listener(msg);
      } catch (err) {
        recordData("react-devtools-frontend-error", {
          errorMessage: (err as Error).message,
        });
        console.warn("Error in ReactDevTools frontend", err);
      }
    };
    return () => {
      this._listener = undefined;
    };
  }

  // send an annotation from the backend in the recording to the frontend
  sendAnnotation(message: ParsedReactDevToolsAnnotation["contents"]) {
    this._listener?.(message);
  }

  disablePickerParentAndInternal() {
    this.disablePickerInParentPanel();
    this.disablePickerInsideRDTComponent();
  }

  disablePickerInsideRDTComponent() {
    this._listener?.({ event: "stopInspectingNative", payload: true });
  }

  // This is called  by the `useEffect` in the React DevTools panel.
  async setUpRDTInternalsForCurrentPause() {
    // Preload the React DevTools Backend for this pause
    await this.ensureReactDevtoolsBackendLoaded();
    // We should also kick off a request to pre-fetch the `Map<nodeId, fiberId>` lookup for this pause.
    // That way, we have the data on hand when the user clicks on a node.
    // This is async, but we won't wait for it here.
    this.fetchNodeIdsToFiberIdsForPause();
  }

  async fetchNodeIdsToFiberIdsForPause() {
    return nodesToFiberIdsCache.readAsync(this.replayClient!, this.pauseId!, this.store!);
  }

  // called by the frontend to send a request to the backend
  async send(event: string, payload: any) {
    await this.ensureReactDevtoolsBackendLoaded();

    try {
      switch (event) {
        case "inspectElement": {
          // Passport onboarding
          this.dismissInspectComponentNag();
          if (this.inspectedElements.has(payload.id) && !payload.path) {
            // this element has been inspected before, the frontend asks to inspect it again
            // to see if there are any changes - in Replay there won't be any so we can send
            // the response immediately without asking the backend
            this._listener?.({
              event: "inspectedElement",
              payload: {
                responseID: payload.requestID,
                id: payload.id,
                type: "no-change",
              },
            });
          } else {
            if (!payload.path) {
              this.inspectedElements.add(payload.id);
            }
            this.sendRequest(event, payload);
          }
          break;
        }

        case "getBridgeProtocol": {
          const response = await this.sendRequest(event, payload);
          if (response === undefined) {
            trackEvent("error.reactdevtools.set_protocol_failed");
            sendTelemetryEvent("reactdevtools.set_protocol_failed");
            this.setProtocolCheckFailed(true);
          }
          break;
        }

        case "highlightNativeElement": {
          const { rendererID, id } = payload;

          if (this.highlightedElementId) {
            this.unhighlightNode();
          }
          this.highlightedElementId = id;

          // This _should_ be pre-fetched already, but await just in case
          const [, fiberIdsToNodeIds] = await this.fetchNodeIdsToFiberIdsForPause();

          // Get the first node ID we found for this fiber ID, if available.
          const [nodeId] = fiberIdsToNodeIds.get(id) ?? [];

          if (!nodeId || this.highlightedElementId !== id) {
            sendTelemetryEvent("reactdevtools.node_not_found", payload);
            return;
          }

          this.highlightNode(nodeId);
          break;
        }

        case "clearNativeElementHighlight": {
          this.unhighlightNode();
          this.highlightedElementId = undefined;
          break;
        }

        case "startInspectingNative": {
          // Note that this message takes time to percolate upwards from the RDT internals
          // up to here. This makes coordination of "is the picker active" tricky.
          this.initializePicker();

          const boundingRects = await this.fetchMouseTargetsForPause();

          if (!boundingRects?.length) {
            sendTelemetryEvent("reactdevtools.bounding_client_rects_failed");
            this.disablePickerParentAndInternal();
            break;
          }

          // Should have been pre-fetched already
          const [nodeIdsToFiberIds] = await this.fetchNodeIdsToFiberIdsForPause();
          // Limit the NodePicker logic to check against just the nodes we got back
          const enabledNodeIds: Set<string> = new Set(nodeIdsToFiberIds.keys());

          this.enablePicker({
            name: "reactComponent",
            onHovering: async nodeId => {
              if (nodeId) {
                const fiberId = nodeIdsToFiberIds.get(nodeId);
                if (fiberId) {
                  this._listener?.({ event: "selectFiber", payload: fiberId });
                }
              }
            },
            onPicked: _ => {
              this.disablePickerInsideRDTComponent();
            },
            onHighlightNode: this.highlightNode,
            onUnhighlightNode: this.unhighlightNode,
            onClickOutsideCanvas: () => {
              // Need to both cancel the Redux logic _and_
              // tell the RDT component to stop inspecting
              this.disablePickerParentAndInternal();
            },
            enabledNodeIds,
          });

          break;
        }

        case "stopInspectingNative": {
          this.disablePickerInParentPanel();
          break;
        }
      }
    } catch (err) {
      // we catch for the case where a region is unloaded and ThreadFront fails
      console.warn(err);
    }
  }

  public async ensureReactDevtoolsBackendLoaded() {
    const recordingTarget = await recordingTargetCache.readAsync(this.replayClient);

    if (recordingTarget === "chromium") {
      const pauseId = await ThreadFront.getCurrentPauseId(this.replayClient);
      await injectReactDevtoolsBackend(this.replayClient, pauseId);
    }
  }

  // send a request to the backend in the recording and the reply to the frontend
  private async sendRequest(event: string, payload: any) {
    const originalPauseId = this.pauseId;
    const response = await evaluate({
      replayClient: this.replayClient,
      text: ` window.__RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("${event}", ${JSON.stringify(
        payload
      )})`,
    });

    if (response.returned) {
      assert(this.pauseId, "Must have a pause ID to handle a response!");
      const result: any = await getJSON(this.replayClient, this.pauseId, response.returned);

      if (result && this.pauseId === originalPauseId) {
        this._listener?.({ event: result.event, payload: result.data });
      }
      return result;
    }
  }

  public async getComponentLocation(elementID: number) {
    const rendererID = this.store!.getRendererIDForElement(elementID);
    if (rendererID != null) {
      // See original React DevTools extension implementation for comparison:
      // https://github.com/facebook/react/blob/v18.0.0/packages/react-devtools-extensions/src/main.js#L194-L220

      // Ask the renderer interface to determine the component function,
      // and store it as a global variable on the window
      await this.sendRequest("viewElementSource", { id: elementID, rendererID });

      // This will be evaluated in the paused browser
      function retrieveSelectedReactComponentFunction() {
        const $type: React.ComponentType | undefined = (window as any).$type;
        if ($type != null) {
          if ($type && $type.prototype && $type.prototype.isReactComponent) {
            // inspect Component.render, not constructor
            return $type.prototype.render;
          } else {
            // inspect Functional Component
            return $type;
          }
        }
      }

      const findSavedComponentFunctionCommand = `
      (${retrieveSelectedReactComponentFunction})()
    `;

      const res = await evaluate({
        replayClient: this.replayClient,
        text: findSavedComponentFunctionCommand,
      });

      if (res?.returned?.object) {
        const componentFunctionPreview = await objectCache.readAsync(
          this.replayClient,
          this.pauseId!,
          res.returned.object,
          "canOverflow"
        );

        return componentFunctionPreview;
      }
    }
  }
}

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
  reactDevToolsInlineModule: ReactDevToolsInlineModule,
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
  const { createBridge, createStore, initialize } = reactDevToolsInlineModule;

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

// React DevTools (RD) changed its internal data structure slightly in a minor update.
// The result is that Replay sessions recorded with older versions of RD don't play well in newer versions.
// We can work around this by checking RD's "bridge protocol" version (which we also store)
// and loading the appropriate frontend version to match.
// For more information see https://github.com/facebook/react/issues/24219
async function loadReactDevToolsInlineModuleFromProtocol(
  stateUpdaterCallback: Function,
  replayClient: ReplayClientInterface,
  pauseId?: string
) {
  if (!pauseId) {
    return;
  }

  // Default assume that it's a recent recording
  let backendBridgeProtocolVersion = 2;

  const recordingTarget = await recordingTargetCache.readAsync(replayClient);

  if (recordingTarget === "gecko") {
    // For Gecko recordings, introspect the page to determine what RDT version was used
    const response = await evaluate({
      replayClient,
      text: ` __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("getBridgeProtocol", undefined)`,
    });
    if (response.returned) {
      // Unwrap the nested eval objects by asking the backend for contents
      // of the nested fields: `{data: {version: 123}}`
      const result: any = await getJSON(replayClient, pauseId, response.returned);
      backendBridgeProtocolVersion = result?.data?.version ?? 2;
    }
  }

  // We should only load the DevTools module once we know which protocol version it requires.
  // If we don't have a version yet, it probably means we're too early in the Replay session.
  if (backendBridgeProtocolVersion >= 2) {
    stateUpdaterCallback(await import("@replayio/react-devtools-inline/frontend"));
  }
  // We no longer support loading a version of `react-devtools-inline`
  // that only knows about protocol version 1.
}

const nodePickerInstance = new NodePickerClass();

const EMPTY_ANNOTATIONS: ParsedReactDevToolsAnnotation[] = [];

function usePrevious<T>(newValue: T) {
  const previousRef = useRef<T>();

  useLayoutEffect(() => {
    previousRef.current = newValue;
  });

  return previousRef.current;
}

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
  const currentPoint = useAppSelector(getCurrentPoint);
  const previousPoint = usePrevious(currentPoint);
  const isFirstAnnotationsInjection = useRef(true);
  const [, forceRender] = useReducer(c => c + 1, 0);

  const isPointWithinFocusWindow = useIsPointWithinFocusWindow(currentPoint);
  const pauseId = useAppSelector(state => state.pause.id);

  const [, dismissInspectComponentNag] = useNag(Nag.INSPECT_COMPONENT);
  const [protocolCheckFailed, setProtocolCheckFailed] = useState(false);
  const { status: annotationsStatus, value: parsedAnnotations } = useImperativeCacheValue(
    reactDevToolsAnnotationsCache,
    replayClient
  );

  // Once we've obtained the protocol version, we'll dynamically load the correct module/version.
  const [reactDevToolsInlineModule, setReactDevToolsInlineModule] =
    useState<ReactDevToolsInlineModule | null>(null);

  const annotations: ParsedReactDevToolsAnnotation[] =
    annotationsStatus === "resolved" ? parsedAnnotations : EMPTY_ANNOTATIONS;

  // Try to load the DevTools module whenever the current point changes.
  // Eventually we'll reach a point that has the DevTools protocol embedded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (reactDevToolsInlineModule === null) {
      loadReactDevToolsInlineModuleFromProtocol(
        setReactDevToolsInlineModule,
        replayClient,
        pauseId
      );
    }
  });

  const [ReactDevTools, wall] = useMemo(() => {
    if (!reactDevToolsInlineModule) {
      return [null, null, null] as const;
    }

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
      reactDevToolsInlineModule,
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
  }, [dispatch, reactDevToolsInlineModule, replayClient, dismissInspectComponentNag]);

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

    if (previousPoint && previousPoint !== currentPoint) {
      // We keep the one RDT UI component instance alive, but operations are additive over time.
      // In order to reset the displayed component tree, we first need to generate a set of fake
      // "remove this React root" operations based on where we _were_ paused, and inject those.
      const clearTreeOperations = generateTreeResetOpsForPoint(previousPoint, annotations);

      for (const rootRemovalOp of clearTreeOperations) {
        wall.sendAnnotation({ event: "operations", payload: rootRemovalOp });
      }
    }

    if (previousPoint !== currentPoint || isFirstAnnotationsInjection.current) {
      isFirstAnnotationsInjection.current = false;

      // Now that the displayed tree is empty, we can inject all operations up to the _current_ point in time.
      for (const { contents, point } of annotations) {
        if (contents.event === "operations" && isExecutionPointsLessThan(point, currentPoint)) {
          wall.sendAnnotation(contents);
        }
      }
    }
  }, [ReactDevTools, wall, previousPoint, currentPoint, annotations, pauseId]);

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

  if (!isPointWithinFocusWindow) {
    return (
      <div className="h-full bg-bodyBgcolor p-2">
        React components are unavailable because you're paused at a point outside{" "}
        <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusMode())}>
          your debugging window
        </span>
        .
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

  const isReactDevToolsReady =
    reactDevToolsInlineModule !== null && ReactDevTools !== null && wall !== null;
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
  return (
    <ErrorBoundary name="ReactDevTools">
      <ReactDevtoolsPanel />
    </ErrorBoundary>
  );
}
