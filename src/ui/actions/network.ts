import {
  RequestInfo,
  RequestEventInfo,
  TimeStampedPoint,
  responseBodyData,
  RequestId,
  requestBodyData,
} from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { AppDispatch } from "ui/setup";
import { createFrame } from "devtools/client/debugger/src/client/create";

export const NEW_NETWORK_REQUESTS = "NEW_NETWORK_REQUESTS";

type NewNetworkRequestsAction = {
  type: "NEW_NETWORK_REQUESTS";
  payload: { requests: RequestInfo[]; events: RequestEventInfo[] };
};

type NewResponseBodyPartsAction = {
  type: "NEW_RESPONSE_BODY_PARTS";
  payload: { responseBodyParts: responseBodyData };
};

type NewRequestBodyPartsAction = {
  type: "NEW_REQUEST_BODY_PARTS";
  payload: { requestBodyParts: requestBodyData };
};

type SetFramesAction = {
  type: "SET_FRAMES";
  payload: { frames: any[]; point: string };
};

export type NetworkAction =
  | NewNetworkRequestsAction
  | SetFramesAction
  | NewResponseBodyPartsAction
  | NewRequestBodyPartsAction;

export const newResponseBodyParts = (
  responseBodyParts: responseBodyData
): NewResponseBodyPartsAction => ({
  type: "NEW_RESPONSE_BODY_PARTS",
  payload: { responseBodyParts },
});

export const newRequestBodyParts = (
  requestBodyParts: requestBodyData
): NewRequestBodyPartsAction => ({
  type: "NEW_REQUEST_BODY_PARTS",
  payload: { requestBodyParts },
});

export const newNetworkRequests = ({
  requests,
  events,
}: {
  requests: RequestInfo[];
  events: RequestEventInfo[];
}): NewNetworkRequestsAction => ({
  type: "NEW_NETWORK_REQUESTS",
  payload: { requests, events },
});

export function fetchResponseBody(requestId: RequestId) {
  ThreadFront.fetchResponseBody(requestId);
}

export function fetchRequestBody(requestId: RequestId) {
  ThreadFront.fetchRequestBody(requestId);
}

export function fetchFrames(tsPoint: TimeStampedPoint) {
  return async ({ dispatch }: { dispatch: AppDispatch }) => {
    const pause = ThreadFront.ensurePause(tsPoint.point, tsPoint.time);
    const frames = (await pause.getFrames())?.filter(Boolean) || [];
    const formattedFrames = await Promise.all(frames?.map((frame, i) => createFrame(frame, i)));
    dispatch({
      type: "SET_FRAMES",
      payload: { frames: formattedFrames, point: tsPoint.point },
    });
  };
}
