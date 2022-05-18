import {
  RequestInfo,
  RequestEventInfo,
  TimeStampedPoint,
  responseBodyData,
  RequestId,
  requestBodyData,
  ExecutionPoint,
} from "@recordreplay/protocol";
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

function fetchResponseBody(requestId: RequestId, point: ExecutionPoint): UIThunkAction {
  return (dispatch, getState, { ThreadFront }) => {
    const loadedRegions = getLoadedRegions(getState());

    // Bail if the selected request's point has not been loaded yet
    if (!loadedRegions || !isPointInRegions(loadedRegions.loaded, point)) {
      return false;
    }

    ThreadFront.fetchResponseBody(requestId);
  };
}

function fetchRequestBody(requestId: RequestId, point: ExecutionPoint): UIThunkAction {
  return (dispatch, getState, { ThreadFront }) => {
    const loadedRegions = getLoadedRegions(getState());

    // Bail if the selected request's point has not been loaded yet
    if (!loadedRegions || !isPointInRegions(loadedRegions.loaded, point)) {
      return;
    }

    ThreadFront.fetchRequestBody(requestId);
  };
}

function fetchFrames(tsPoint: TimeStampedPoint): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const pause = ThreadFront.ensurePause(tsPoint.point, tsPoint.time);
    const frames = (await pause.getFrames())?.filter(Boolean) || [];
    const formattedFrames = await Promise.all(frames?.map((frame, i) => createFrame(frame, i)));
    dispatch({
      type: "SET_FRAMES",
      payload: { frames: formattedFrames, point: tsPoint.point },
    });
  };
}

function showRequestDetails(requestId: RequestId): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const request = state.network.requests.find(request => request.id === requestId);
    const loadedRegions = getLoadedRegions(state);

    // Don't select a request that's not within a loaded region.
    if (!request || !loadedRegions || !isPointInRegions(loadedRegions.loaded, request.point)) {
      return;
    }

    dispatch({
      requestId,
      type: "SHOW_REQUEST_DETAILS",
    });
  };
}

export function hideRequestDetails() {
  return {
    type: "HIDE_REQUEST_DETAILS",
  };
}

export function selectAndFetchRequest(requestId: RequestId): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const requestSummary = getSummaryById(state, requestId);

    if (!requestSummary) {
      console.error(`Could not find summary for request "${requestId}"`);
      return;
    }

    dispatch(fetchFrames(requestSummary.point));

    if (requestSummary.hasResponseBody) {
      dispatch(fetchResponseBody(requestId, requestSummary.point.point));
    }
    if (requestSummary.hasRequestBody) {
      dispatch(fetchRequestBody(requestId, requestSummary.point.point));
    }

    dispatch(showRequestDetails(requestId));
  };
}
