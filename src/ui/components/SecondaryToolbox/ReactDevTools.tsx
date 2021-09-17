import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { createBridge, createStore, initialize, Wall } from "react-devtools-inline/frontend";
import { ExecutionPoint } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { compareNumericStrings } from "protocol/utils";
import { UIState } from "ui/state";
import { Annotation } from "ui/state/reactDevTools";
import { getAnnotations, getCurrentPoint } from "ui/reducers/reactDevTools";

// used by the frontend to communicate with the backend
class ReplayWall implements Wall {
  private _listener?: (msg: any) => void;
  private inspectedElements = new Set();

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
    if (event == "inspectElement") {
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
    }
    if (event == "getBridgeProtocol") {
      this.sendRequest(event, payload);
    }
  }

  // send a request to the backend in the recording and the reply to the frontend
  private async sendRequest(event: string, payload: any) {
    const response = await ThreadFront.evaluate(
      0,
      undefined,
      ` __RECORD_REPLAY_REACT_DEVTOOLS_SEND_MESSAGE__("${event}", ${JSON.stringify(payload)})`
    );
    if (response.returned) {
      const result: any = await response.returned.getJSON();
      this._listener?.({ event: result.event, payload: result.data });
    }
  }
}

function createReactDevTools(annotations: Annotation[], currentPoint: ExecutionPoint) {
  const target = { postMessage() {} };
  const wall = new ReplayWall();
  const bridge = createBridge(target, wall);
  const store = createStore(bridge, { supportsNativeInspection: false });
  const ReactDevTools = initialize(target, { bridge, store });

  for (const { message, point } of annotations) {
    if (message.event === "operations" && compareNumericStrings(point, currentPoint) <= 0) {
      wall.sendAnnotation(message);
    }
  }

  return ReactDevTools;
}

function ReactDevtoolsPanel({ annotations, currentPoint }: PropsFromRedux) {
  if (currentPoint === null) {
    return null;
  }

  const ReactDevTools = createReactDevTools(annotations, currentPoint);

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

const connector = connect((state: UIState) => ({
  annotations: getAnnotations(state),
  currentPoint: getCurrentPoint(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(ReactDevtoolsPanel);
