import { ExecutionPoint, NodeBounds, ObjectId } from "@replayio/protocol";
import React, { useContext } from "react";
import { useEffect, useState } from "react";
import type { Store, Wall } from "react-devtools-inline/frontend";

import { highlightNode, unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import { ThreadFront } from "protocol/thread";
import { RecordingCapabilities, RecordingTarget } from "protocol/thread/thread";
import { compareNumericStrings } from "protocol/utils";
import {
  getObjectPropertyHelper,
  getObjectWithPreviewHelper,
} from "replay-next/src/suspense/ObjectPreviews";
import { getRecordingCapabilitiesSuspense } from "replay-next/src/suspense/RecordingCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { ReplayClientInterface } from "shared/client/types";
import { fetchMouseTargetsForPause } from "ui/actions/app";
import { setHasReactComponents, setProtocolCheckFailed } from "ui/actions/reactDevTools";
import {
  getCurrentPoint,
  getTheme,
  setIsNodePickerActive,
  setIsNodePickerInitializing,
} from "ui/reducers/app";
import {
  getAnnotations,
  getProtocolCheckFailed,
  getReactInitPoint,
} from "ui/reducers/reactDevTools";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Annotation } from "ui/state/reactDevTools";
import { getMouseTarget } from "ui/suspense/nodeCaches";
import { NodePicker as NodePickerClass, NodePickerOpts } from "ui/utils/nodePicker";
import { getJSON } from "ui/utils/objectFetching";
import { sendTelemetryEvent, trackEvent } from "ui/utils/telemetry";

import {
  injectReactDevtoolsBackend,
  logWindowMessages,
} from "./react-devtools/injectReactDevtoolsBackend";

type ReactDevToolsInlineModule = typeof import("react-devtools-inline/frontend");

type NodeOptsWithoutBounds = Omit<NodePickerOpts, "onCheckNodeBounds">;

const getDOMNodes = `((rendererID, id) => __REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.get(rendererID).findNativeNodesForFiberID(id))`;

// used by the frontend to communicate with the backend
class ReplayWall implements Wall {
  private _listener?: (msg: any) => void;
  private inspectedElements = new Set();
  private highlightedElementId?: number;
  private recordingTarget: RecordingTarget | null = null;
  store?: Store;

  constructor(
    private enablePicker: (opts: NodeOptsWithoutBounds) => void,
    private initializePicker: () => void,
    private disablePicker: () => void,
    private onShutdown: () => void,
    private highlightNode: (nodeId: string) => void,
    private unhighlightNode: () => void,
    private fetchMouseTargetsForPause: () => Promise<NodeBounds[] | undefined>,
    private replayClient: ReplayClientInterface,
    private pauseId: string | undefined
  ) {}

  // called by the frontend to register a listener for receiving backend messages
  listen(listener: (msg: any) => void) {
    this._listener = msg => {
      try {
        listener(msg);
      } catch (err) {
        console.warn("Error in ReactDevTools frontend", err);
      }
    };
    return () => {
      this._listener = undefined;
    };
  }

  // send an annotation from the backend in the recording to the frontend
  sendAnnotation(annotation: Annotation) {
    this._listener?.(annotation);
  }

  // called by the frontend to send a request to the backend
  async send(event: string, payload: any) {
    await this.ensureReactDevtoolsBackendLoaded();

    try {
      switch (event) {
        case "inspectElement": {
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
            setProtocolCheckFailed();
          }
          break;
        }

        case "highlightNativeElement": {
          const { rendererID, id } = payload;

          if (this.highlightedElementId) {
            this.unhighlightNode();
          }
          this.highlightedElementId = id;

          const response = await ThreadFront.evaluateNew({
            replayClient: this.replayClient,
            text: `${getDOMNodes}(${rendererID}, ${id})[0]`,
          });

          const nodeId = response.returned?.object;
          if (!nodeId || this.highlightedElementId !== id) {
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
          this.initializePicker();

          const boundingRects = await this.fetchMouseTargetsForPause();

          if (!boundingRects?.length) {
            this.disablePicker();
            this._listener?.({ event: "stopInspectingNative", payload: true });
            break;
          }

          const nodeToElementId = await this.mapNodesToElements();

          this.enablePicker({
            onHovering: nodeId => {
              const elementId = nodeId && nodeToElementId.get(nodeId);
              elementId && this._listener?.({ event: "selectFiber", payload: elementId });
            },
            onPicked: _ => {
              this._listener?.({ event: "stopInspectingNative", payload: true });
            },
            onHighlightNode: this.highlightNode,
            onUnhighlightNode: this.unhighlightNode,
            enabledNodeIds: [...nodeToElementId.keys()],
          });

          break;
        }

        case "stopInspectingNative": {
          this.disablePicker();
          break;
        }
      }
    } catch (err) {
      // we catch for the case where a region is unloaded and ThreadFront fails
      console.warn(err);
    }
  }

  private async ensureReactDevtoolsBackendLoaded() {
    if (this.recordingTarget === null) {
      this.recordingTarget = await ThreadFront.getRecordingTarget();
    }

    if (this.recordingTarget === "chromium") {
      await injectReactDevtoolsBackend(ThreadFront, this.replayClient);
    }
  }

  // send a request to the backend in the recording and the reply to the frontend
  private async sendRequest(event: string, payload: any) {
    try {
      const response = await ThreadFront.evaluateNew({
        replayClient: this.replayClient,
        text: ` window.__RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("${event}", ${JSON.stringify(
          payload
        )})`,
      });

      if (response.returned) {
        const result: any = await getJSON(this.replayClient, this.pauseId!, response.returned);

        if (result) {
          this._listener?.({ event: result.event, payload: result.data });
        }
        return result;
      }
    } finally {
      await logWindowMessages(ThreadFront, this.replayClient);
    }
  }

  private async mapNodesToElements() {
    await this.ensureReactDevtoolsBackendLoaded();

    const nodeToElementId = new Map<ObjectId, number>();
    for (const rootID of this.store!._roots) {
      const rendererID = this.store!._rootIDToRendererID.get(rootID)!;
      const elementIDs = JSON.stringify(this.collectElementIDs(rootID));
      const expr = `${elementIDs}.reduce((map, id) => { for (node of ${getDOMNodes}(${rendererID}, id) || []) { map.set(node, id); } return map; }, new Map())`;
      const response = await ThreadFront.evaluateNew({
        replayClient: this.replayClient,
        text: expr,
      });
      if (response.returned?.object) {
        const mapObjData = await getObjectWithPreviewHelper(
          this.replayClient,
          this.pauseId!,
          response.returned.object
        );

        mapObjData.preview?.containerEntries?.forEach(entry => {
          // The backend should have returned numeric node IDs as values.
          // The keys are DOM node objects. We don't need to fetch them,
          // because all we care about here is the object IDs anyway.
          if (typeof entry.key?.object === "string" && typeof entry.value.value === "number") {
            nodeToElementId.set(entry.key.object, entry.value.value);
          }
        });
      }
    }
    return nodeToElementId;
  }

  private collectElementIDs(elementID: number, elementIDs?: number[]) {
    if (!elementIDs) {
      elementIDs = [];
    }
    elementIDs.push(elementID);
    const element = this.store!._idToElement.get(elementID);
    for (const childID of element!.children) {
      this.collectElementIDs(childID, elementIDs);
    }
    return elementIDs;
  }
}

function createReactDevTools(
  reactDevToolsInlineModule: ReactDevToolsInlineModule,
  annotations: Annotation[],
  currentPoint: ExecutionPoint,
  enablePicker: (opts: NodeOptsWithoutBounds) => void,
  initializePicker: () => void,
  disablePicker: () => void,
  onShutdown: () => void,
  highlightNode: (nodeId: string) => void,
  unhighlightNode: () => void,
  fetchMouseTargetsForPause: () => Promise<NodeBounds[] | undefined>,
  replayClient: ReplayClientInterface,
  pauseId: string | undefined
) {
  const { createBridge, createStore, initialize } = reactDevToolsInlineModule;

  const target = { postMessage() {} };
  const wall = new ReplayWall(
    enablePicker,
    initializePicker,
    disablePicker,
    onShutdown,
    highlightNode,
    unhighlightNode,
    fetchMouseTargetsForPause,
    replayClient,
    pauseId
  );
  const bridge = createBridge(target, wall);
  const store = createStore(bridge, {
    checkBridgeProtocolCompatibility: false,
    supportsNativeInspection: true,
  });
  wall.store = store;
  const ReactDevTools = initialize(target, { bridge, store });

  for (const { message, point } of annotations) {
    if (message.event === "operations" && compareNumericStrings(point, currentPoint) <= 0) {
      wall.sendAnnotation(message);
    }
  }

  return ReactDevTools;
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

  const recordingTarget = await ThreadFront.getRecordingTarget();

  if (recordingTarget === "gecko") {
    // For Gecko recordings, introspect the page to determine what RDT version was used
    const response = await ThreadFront.evaluateNew({
      replayClient,
      text: ` __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("getBridgeProtocol", undefined)`,
    });
    if (response.returned?.object) {
      // Unwrap the nested eval objects by asking the backend for contents
      // of the nested fields: `{data: {version: 123}}`
      const responseDataObject = await getObjectPropertyHelper(
        replayClient,
        pauseId,
        response.returned.object,
        "data"
      );
      const versionData = (await getObjectPropertyHelper(
        replayClient,
        pauseId,
        responseDataObject.object!,
        "version"
      )) as { value: number };
      if (versionData.value) {
        backendBridgeProtocolVersion = versionData.value;
      }
    }
  }

  // We should only load the DevTools module once we know which protocol version it requires.
  // If we don't have a version yet, it probably means we're too early in the Replay session.
  if (backendBridgeProtocolVersion >= 2) {
    stateUpdaterCallback(await import("react-devtools-inline/frontend"));
  } else if (backendBridgeProtocolVersion === 1) {
    stateUpdaterCallback(await import("react-devtools-inline_4_18_0/frontend"));
  }
}

const nodePickerInstance = new NodePickerClass();

export default function ReactDevtoolsPanel() {
  const annotations = useAppSelector(getAnnotations);
  const currentPoint = useAppSelector(getCurrentPoint);
  const protocolCheckFailed = useAppSelector(getProtocolCheckFailed);
  const reactInitPoint = useAppSelector(getReactInitPoint);
  const pauseId = useAppSelector(state => state.pause.id);

  const dispatch = useAppDispatch();

  const theme = useAppSelector(getTheme);
  const replayClient = useContext(ReplayClientContext);

  // Once we've obtained the protocol version, we'll dynamically load the correct module/version.
  const [reactDevToolsInlineModule, setReactDevToolsInlineModule] =
    useState<ReactDevToolsInlineModule | null>(null);

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

  if (currentPoint === null) {
    return null;
  }

  function enablePicker(opts: NodeOptsWithoutBounds) {
    dispatch(setIsNodePickerActive(true));
    dispatch(setIsNodePickerInitializing(false));

    const actualOpts: NodePickerOpts = {
      ...opts,
      onCheckNodeBounds: async (x, y, nodeIds) => {
        const boundingRects = await dispatchFetchMouseTargets();
        return getMouseTarget(boundingRects ?? [], x, y, nodeIds);
      },
    };
    nodePickerInstance.enable(actualOpts);
  }
  function initializePicker() {
    dispatch(setIsNodePickerActive(false));
    dispatch(setIsNodePickerInitializing(true));
  }
  function disablePicker() {
    nodePickerInstance.disable();
    dispatch(setIsNodePickerActive(false));
    dispatch(setIsNodePickerInitializing(false));
  }

  function onShutdown() {
    sendTelemetryEvent("react-devtools-shutdown");
    dispatch(setHasReactComponents(false));
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

  const isReactDevToolsReady = reactDevToolsInlineModule !== null;
  const isReady =
    isReactDevToolsReady &&
    reactInitPoint !== null &&
    currentPoint !== null &&
    compareNumericStrings(reactInitPoint, currentPoint) <= 0;

  if (!isReady) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
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

  const ReactDevTools = createReactDevTools(
    reactDevToolsInlineModule,
    annotations,
    currentPoint,
    enablePicker,
    initializePicker,
    disablePicker,
    onShutdown,
    dispatchHighlightNode,
    dispatchUnhighlightNode,
    dispatchFetchMouseTargets,
    replayClient,
    pauseId
  );

  return (
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
      hideViewSourceAction={true}
    />
  );
}
