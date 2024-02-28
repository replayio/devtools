import { Frame, RequestId } from "@replayio/protocol";

import { createFrame } from "devtools/client/debugger/src/client/create";
import { Context } from "devtools/client/debugger/src/reducers/pause";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import {
  networkRequestBodyCache,
  networkRequestsCache,
  networkResponseBodyCache,
} from "replay-next/src/suspense/NetworkRequestsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { isPointInRegion } from "shared/utils/time";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";

import { seek } from "./timeline";
import { UIThunkAction } from ".";

type ShowRequestDetailsAction = {
  type: "SHOW_REQUEST_DETAILS";
  requestId: RequestId;
};

type HideRequestDetailsAction = {
  type: "HIDE_REQUEST_DETAILS";
};

export type NetworkAction = ShowRequestDetailsAction | HideRequestDetailsAction;

export function hideRequestDetails() {
  return {
    type: "HIDE_REQUEST_DETAILS",
  };
}

export function showRequestDetails(requestId: RequestId) {
  return {
    requestId,
    type: "SHOW_REQUEST_DETAILS",
  };
}

export function selectNetworkRequest(requestId: RequestId): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    let state = getState();

    const stream = networkRequestsCache.stream(replayClient);
    await stream.resolver;
    const records = stream.data!;

    const record = records[requestId];

    const focusWindow = replayClient.getCurrentFocusWindow();

    // Don't select a request that's not within the focus window
    if (!record || !focusWindow || !isPointInRegion(record.timeStampedPoint.point, focusWindow)) {
      return;
    }

    dispatch(showRequestDetails(requestId));

    const pauseId = await pauseIdCache.readAsync(
      replayClient,
      record.timeStampedPoint.point,
      record.timeStampedPoint.time
    );
    const frames = (await framesCache.readAsync(replayClient, pauseId)) || [];
    await sourcesCache.readAsync(replayClient);
    state = getState();
    const formattedFrames = frames?.map((frame, i) =>
      createFrame(state.sources, frame, pauseId, i)
    );
    dispatch({
      type: "SET_FRAMES",
      payload: { frames: formattedFrames, point: record.timeStampedPoint.point },
    });

    if (record.events.bodyEvent) {
      networkRequestBodyCache.prefetch(replayClient, requestId);
    }
    if (record.events.responseBodyEvent) {
      networkResponseBodyCache.prefetch(replayClient, requestId);
    }
  };
}

export function seekToRequestFrame(
  request: RequestSummary,
  frame: Frame,
  cx: Context
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const focusWindow = replayClient.getCurrentFocusWindow();
    const point = request.point;

    // Don't select a request that's not within a focus window
    if (!request || !focusWindow || !isPointInRegion(point.point, focusWindow)) {
      return;
    }

    dispatch(seek({ executionPoint: point.point, time: point.time, openSource: true }));
  };
}
