import React from "react";
import { connect, ConnectedProps } from "react-redux";
import {
  createBridge,
  createStore,
  FrontendEvent,
  initialize,
  Store,
  Wall,
} from "react-devtools-inline/frontend";
import { ExecutionPoint, ObjectId } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";
import { Annotation } from "ui/state/reactDevTools";
import {
  getAnnotations,
  getCurrentPoint,
  getProtocolCheckFailed,
  getReactInitPoint,
} from "ui/reducers/reactDevTools";
import { setIsNodePickerActive } from "ui/actions/app";
import { setHasReactComponents, setProtocolCheckFailed } from "ui/actions/reactDevTools";
import Highlighter from "highlighter/highlighter";
import NodePicker, { NodePickerOpts } from "ui/utils/nodePicker";
import { sendTelemetryEvent, trackEvent } from "ui/utils/telemetry";

const getDOMNodes = `((rendererID, id) => __REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.get(rendererID).findNativeNodesForFiberID(id))`;

// used by the frontend to communicate with the backend
class ReplayWall implements Wall {
  private _listener?: (msg: any) => void;
  private inspectedElements = new Set();
  private highlightedElementId?: number;
  store?: Store;

  constructor(
    private enablePicker: (opts: NodePickerOpts) => void,
    private disablePicker: () => void,
    private onShutdown: () => void
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
  async send(event: FrontendEvent, payload: any) {
    console.log(`RDT: ${event}`, payload);
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
            Highlighter.unhighlight();
          }
          this.highlightedElementId = id;

          const response = await ThreadFront.evaluate({
            asyncIndex: 0,
            text: `${getDOMNodes}(${rendererID}, ${id})[0]`,
          });
          if (!response.returned || this.highlightedElementId !== id) {
            return;
          }

          const nodeFront = response.returned.getNodeFront();
          if (!nodeFront || this.highlightedElementId !== id) {
            return;
          }

          Highlighter.highlight(nodeFront);
          break;
        }

        case "clearNativeElementHighlight": {
          Highlighter.unhighlight();
          this.highlightedElementId = undefined;
          break;
        }

        case "startInspectingNative": {
          ThreadFront.ensureCurrentPause();
          await ThreadFront.currentPause!.createWaiter;
          const rv = await ThreadFront.currentPause!.loadMouseTargets();

          if (!rv) {
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

  // send a request to the backend in the recording and the reply to the frontend
  private async sendRequest(event: string, payload: any) {
    const response = await ThreadFront.evaluate({
      asyncIndex: 0,
      text: ` __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("${event}", ${JSON.stringify(
        payload
      )})`,
    });

    if (response.returned) {
      const result: any = await response.returned.getJSON();
      this._listener?.({ event: result.event, payload: result.data });
      return result;
    }

    return response.returned;
  }

  private async mapNodesToElements() {
    const nodeToElementId = new Map<ObjectId, number>();
    for (const rootID of this.store!._roots) {
      const rendererID = this.store!._rootIDToRendererID.get(rootID)!;
      const elementIDs = JSON.stringify(this.collectElementIDs(rootID));
      const expr = `${elementIDs}.reduce((map, id) => { for (node of ${getDOMNodes}(${rendererID}, id)) { map.set(node, id); } return map; }, new Map())`;
      const response = await ThreadFront.evaluate({ asyncIndex: 0, text: expr });
      if (response.returned) {
        const entries = response.returned.previewContainerEntries();
        for (const { key, value } of entries) {
          if (!key?.isObject() || !value.isPrimitive() || typeof value.primitive() !== "number") {
            continue;
          }
          nodeToElementId.set(key.objectId()!, value.primitive() as number);
        }
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
  annotations: Annotation[],
  currentPoint: ExecutionPoint,
  enablePicker: (opts: NodePickerOpts) => void,
  disablePicker: () => void,
  onShutdown: () => void
) {
  const target = { postMessage() {} };
  const wall = new ReplayWall(enablePicker, disablePicker, onShutdown);
  const bridge = createBridge(target, wall);
  const store = createStore(bridge, { supportsNativeInspection: true });
  wall.store = store;
  const ReactDevTools = initialize(target, { bridge, store });

  for (const { message, point } of annotations) {
    if (message.event === "operations" && compareNumericStrings(point, currentPoint) <= 0) {
      wall.sendAnnotation(message);
    }
  }

  return ReactDevTools;
}

function ReactDevtoolsPanel({
  annotations,
  currentPoint,
  setIsNodePickerActive,
  setHasReactComponents,
  protocolCheckFailed,
  reactInitPoint,
}: PropsFromRedux) {
  if (currentPoint === null) {
    return null;
  }

  function enablePicker(opts: NodePickerOpts) {
    setIsNodePickerActive(true);
    NodePicker.enable(opts);
  }
  function disablePicker() {
    NodePicker.disable();
    setIsNodePickerActive(false);
  }

  function onShutdown() {
    sendTelemetryEvent("react-devtools-shutdown");
    setHasReactComponents(false);
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

  const isReady =
    reactInitPoint !== null &&
    currentPoint !== null &&
    compareNumericStrings(reactInitPoint, currentPoint) <= 0;

  if (!isReady) {
    return <div className="p-4">React DevTools not yet initialised at this point in time.</div>;
  }

  const ReactDevTools = createReactDevTools(
    annotations,
    currentPoint,
    enablePicker,
    disablePicker,
    onShutdown
  );

  return (
    <ReactDevTools
      browserTheme="light"
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

const connector = connect(
  (state: UIState) => ({
    annotations: getAnnotations(state),
    currentPoint: getCurrentPoint(state),
    protocolCheckFailed: getProtocolCheckFailed(state),
    reactInitPoint: getReactInitPoint(state),
  }),
  { setIsNodePickerActive, setHasReactComponents }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ReactDevtoolsPanel);
