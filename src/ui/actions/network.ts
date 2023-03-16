import {
  Frame,
  RequestEventInfo,
  RequestId,
  RequestInfo,
  requestBodyData,
  responseBodyData,
} from "@replayio/protocol";

import { createFrame } from "devtools/client/debugger/src/client/create";
import { Context } from "devtools/client/debugger/src/reducers/pause";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { getPauseIdAsync } from "replay-next/src/suspense/PauseCache";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { getLoadedRegions } from "ui/reducers/app";
import { getRequestById, getSummaryById } from "ui/reducers/network";
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
  return async (dispatch, getState, { ThreadFront, protocolClient, replayClient }) => {
    let state = getState();
    const request = getRequestById(state, requestId);
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

    dispatch({
      requestId,
      type: "SHOW_REQUEST_DETAILS",
    });

    const timeStampedPoint = requestSummary.point;
    const pauseId = await getPauseIdAsync(
      replayClient,
      timeStampedPoint.point,
      timeStampedPoint.time
    );
    const frames = (await framesCache.readAsync(replayClient, pauseId)) || [];
    await ThreadFront.ensureAllSources();
    state = getState();
    const formattedFrames = frames?.map((frame, i) =>
      createFrame(state.sources, frame, pauseId, i)
    );
    dispatch({
      type: "SET_FRAMES",
      payload: { frames: formattedFrames, point: timeStampedPoint.point },
    });

    const sessionId = getState().app.sessionId!;

    /*
    These API calls don't directly return anything. Instead:

    - on app setup, `webconsole/actions/network.ts` does a search for network requests and their sub-pieces, and also subscribes to future network requests
    - in this thunk, we conditionally call `getResponse/RequestBody()`
    - that API call _by itself_ doesn't return anything...
    - but when the server sends back data, it triggers those event handlers/callbacks to add the data to Redux
  */

    if (requestSummary.hasResponseBody) {
      protocolClient.Network.getResponseBody({ id: requestId, range: { end: 5e9 } }, sessionId);
    }
    if (requestSummary.hasRequestBody) {
      protocolClient.Network.getRequestBody({ id: requestId, range: { end: 5e9 } }, sessionId);
    }
  };
}

export function seekToRequestFrame(
  request: RequestSummary,
  frame: Frame,
  cx: Context
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const state = getState();
    const loadedRegions = getLoadedRegions(state);
    const point = request.point;

    // Don't select a request that's not within a loaded region.
    if (!request || !loadedRegions || !isPointInRegions(loadedRegions.loaded, point.point)) {
      return;
    }

    ThreadFront.timeWarp(point.point, point.time, true, frame);
  };
}
