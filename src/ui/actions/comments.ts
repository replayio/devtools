import { Action } from "@reduxjs/toolkit";
import { RecordingId } from "@replayio/protocol";

import { createSourceLocationLabels } from "bvaughn-architecture-demo/components/sources/utils/createCommentLabels";
import { getFramesAsync } from "bvaughn-architecture-demo/src/suspense/FrameCache";
import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import { getExecutionPoint, getPauseId } from "devtools/client/debugger/src/reducers/pause";
import type { ThreadFront as ThreadFrontType } from "protocol/thread";
import { waitForTime } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { ADD_COMMENT_MUTATION, AddCommentMutation } from "ui/hooks/comments/useAddComment";
import { selectors } from "ui/reducers";
import {
  getPreferredGeneratedSources,
  getPreferredSourceId,
  getSourceDetailsEntities,
} from "ui/reducers/sources";
import { getCurrentTime } from "ui/reducers/timeline";
import { UIState } from "ui/state";
import { Comment, CommentOptions, Reply, SourceLocation } from "ui/state/comments";
import { mutate } from "ui/utils/apolloClient";
import { trackEvent } from "ui/utils/telemetry";

import type { UIThunkAction } from "./index";
import { setSelectedPrimaryPanel } from "./layout";
import { seek } from "./timeline";

type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };

export function setHoveredComment(comment: any): SetHoveredComment {
  return { type: "set_hovered_comment", comment };
}

export function createComment(
  time: number,
  point: string,
  recordingId: RecordingId,
  options: CommentOptions
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    let {
      sourceLocation,
      hasFrames,
      position,
      networkRequestId,
      primaryLabel = null,
      secondaryLabel = null,
    } = options;

    if (primaryLabel === null && secondaryLabel === null) {
      if (sourceLocation) {
        ({ primaryLabel, secondaryLabel } = await createSourceLocationLabels(
          replayClient,
          sourceLocation.sourceId,
          sourceLocation.line,
          sourceLocation.column
        ));
      }
    }

    trackEvent("comments.create");

    await mutate<AddCommentMutation>({
      mutation: ADD_COMMENT_MUTATION,
      variables: {
        input: {
          content: "",
          hasFrames,
          isPublished: false,
          networkRequestId: networkRequestId || null,
          point,
          position,
          primaryLabel,
          recordingId,
          secondaryLabel,
          sourceLocation,
          time,
        },
      },
    });

    dispatch(setSelectedPrimaryPanel("comments"));
  };
}

export function createFrameComment(
  position: { x: number; y: number } | null,
  recordingId: RecordingId,
  base64PNG: string | null,
  relativePosition: { x: number; y: number } | null
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront, replayClient }) => {
    const state = getState();
    const currentTime = getCurrentTime(state);

    // Comments require execution points;
    // but if the current time is within an unloaded region, the client might not know the execution point.
    // In this case we should ask the server for a nearby point.
    let executionPoint = getExecutionPoint(state);
    if (executionPoint === null) {
      executionPoint = (await replayClient.getPointNearTime(currentTime)).point;
    }

    dispatch(
      createComment(currentTime, executionPoint, recordingId, {
        position,
        hasFrames: true,
        sourceLocation: null,
        primaryLabel: JSON.stringify(relativePosition),
        secondaryLabel: base64PNG,
      })
    );
  };
}

function getCurrentPauseSourceLocationWithTimeout(
  ThreadFront: typeof ThreadFrontType,
  replayClient: ReplayClientInterface,
  getState: () => UIState
) {
  return Promise.race([
    getCurrentPauseSourceLocation(ThreadFront, replayClient, getState),
    waitForTime(1000),
  ]);
}

export function createFloatingCodeComment(
  recordingId: RecordingId,
  breakpoint: any
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const state = getState();
    const currentTime = getCurrentTime(state);

    // Comments require execution points;
    // but if the current time is within an unloaded region, the client might not know the execution point.
    // In this case we should ask the server for a nearby point.
    let executionPoint = getExecutionPoint(state);
    if (executionPoint === null) {
      executionPoint = (await replayClient.getPointNearTime(currentTime)).point;
    }

    dispatch(
      createComment(currentTime, executionPoint, recordingId, {
        position: null,
        hasFrames: false,
        sourceLocation: breakpoint.location || null,
      })
    );
  };
}

export function createNetworkRequestComment(
  request: RequestSummary,
  recordingId: RecordingId
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const state = getState();
    const time = request.triggerPoint?.time ?? getCurrentTime(state);

    // Comments require execution points;
    // but if the current time is within an unloaded region, the client might not know the execution point.
    // In this case we should ask the server for a nearby point.
    let executionPoint = request.triggerPoint?.point || getExecutionPoint(state);
    if (executionPoint === null) {
      executionPoint = (await replayClient.getPointNearTime(time)).point;
    }

    dispatch(
      createComment(time, executionPoint, recordingId, {
        position: null,
        hasFrames: false,
        sourceLocation: null,
        networkRequestId: request.id,
        primaryLabel: `${request.method} request`,
        secondaryLabel: request.name,
      })
    );
  };
}

export function seekToComment(item: Comment | Reply, openSource: boolean): UIThunkAction {
  return (dispatch, getState) => {
    let context = selectors.getThreadContext(getState());
    dispatch(seek(item.point, item.time, false));
    dispatch(setSelectedPrimaryPanel("comments"));

    if (item.sourceLocation) {
      context = selectors.getThreadContext(getState());
      dispatch(selectLocation(context, item.sourceLocation, openSource));
    }
  };
}

async function getCurrentPauseSourceLocation(
  ThreadFront: typeof ThreadFrontType,
  replayClient: ReplayClientInterface,
  getState: () => UIState
) {
  const pauseId = getPauseId(getState());
  if (!pauseId) {
    return;
  }
  const frame = (await getFramesAsync(replayClient, pauseId))?.[0];
  if (!frame) {
    return;
  }
  await ThreadFront.ensureAllSources();
  const state = getState();
  const sourcesById = getSourceDetailsEntities(state);
  const { location } = frame;
  const preferredSourceId = getPreferredSourceId(
    sourcesById,
    location.map(l => l.sourceId),
    getPreferredGeneratedSources(state)
  );
  const preferredLocation = location.find(l => l.sourceId == preferredSourceId);
  if (!preferredLocation) {
    return;
  }

  const sourceUrl = sourcesById[preferredLocation.sourceId]?.url;
  if (!sourceUrl) {
    return;
  }

  return {
    sourceUrl,
    sourceId: preferredLocation.sourceId,
    line: preferredLocation.line,
    column: preferredLocation.column,
  };
}
