import {
  RequestInfo,
  RequestEventInfo,
  responseBodyData,
  RequestId,
  requestBodyData,
} from "@replayio/protocol";
import { createFrame } from "devtools/client/debugger/src/client/create";
import { getLoadedRegions } from "ui/reducers/app";
import { getSummaryById } from "ui/reducers/network";
import { isPointInRegions } from "ui/utils/timeline";

import { UIThunkAction } from ".";

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

type ShowRequestDetailsAction = {
  type: "SHOW_REQUEST_DETAILS";
  requestId: RequestId;
};

type HideRequestDetailsAction = {
  type: "HIDE_REQUEST_DETAILS";
};

type NetworkRequestsLoadedAction = { type: "NETWORK_REQUESTS_LOADED" };

export type NetworkAction =
  | NetworkRequestsLoadedAction
  | NewNetworkRequestsAction
  | NewRequestBodyPartsAction
  | NewResponseBodyPartsAction
  | SetFramesAction
  | ShowRequestDetailsAction
  | HideRequestDetailsAction;

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

export const networkRequestsLoaded = (): NetworkRequestsLoadedAction => ({
  type: "NETWORK_REQUESTS_LOADED",
});

export function hideRequestDetails() {
  return {
    type: "HIDE_REQUEST_DETAILS",
  };
}

export function selectAndFetchRequest(requestId: RequestId): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const state = getState();
    const request = state.network.requests.find(request => request.id === requestId);
    const loadedRegions = getLoadedRegions(state);

    // Don't select a request that's not within a loaded region.
    if (!request || !loadedRegions || !isPointInRegions(loadedRegions.loaded, request.point)) {
      return;
    }

    const requestSummary = getSummaryById(state, requestId);
    if (!requestSummary) {
      console.error(`Could not find summary for request "${requestId}"`);
      return;
    }

    const timeStampedPoint = requestSummary.point;
    const pause = ThreadFront.ensurePause(timeStampedPoint.point, timeStampedPoint.time);
    const frames = (await pause.getFrames())?.filter(Boolean) || [];
    const formattedFrames = await Promise.all(frames?.map((frame, i) => createFrame(frame, i)));
    dispatch({
      type: "SET_FRAMES",
      payload: { frames: formattedFrames, point: timeStampedPoint.point },
    });

    if (requestSummary.hasResponseBody) {
      ThreadFront.fetchResponseBody(requestId);
    }
    if (requestSummary.hasRequestBody) {
      ThreadFront.fetchRequestBody(requestId);
    }

    dispatch({
      requestId,
      type: "SHOW_REQUEST_DETAILS",
    });
  };
}
