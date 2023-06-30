import { Action } from "@reduxjs/toolkit";
import { RecordingId } from "@replayio/protocol";

import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import { getExecutionPoint, getPauseId } from "devtools/client/debugger/src/reducers/pause";
import type { ThreadFront as ThreadFrontType } from "protocol/thread";
import {
  COMMENT_TYPE_NETWORK_REQUEST,
  COMMENT_TYPE_VISUAL,
  VisualCommentTypeData,
  createTypeDataForNetworkRequestComment,
} from "replay-next/components/sources/utils/comments";
import { topFrameCache } from "replay-next/src/suspense/FrameCache";
import { ReplayClientInterface } from "shared/client/types";
import { mutate } from "shared/graphql/apolloClient";
import { CommentSourceLocation } from "shared/graphql/types";
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
import { Comment, CommentOptions } from "ui/state/comments";
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
  return async dispatch => {
    let {
      hasFrames,
      type,
      typeData,

      // TODO [FE-1058] Delete legacy fields in favor of type/typeData
      networkRequestId,
      position,
      primaryLabel = null,
      secondaryLabel = null,
      sourceLocation,
    } = options;

    trackEvent("comments.create");

    await mutate<AddCommentMutation>({
      mutation: ADD_COMMENT_MUTATION,
      variables: {
        input: {
          content: "",
          hasFrames,
          isPublished: false,
          point,
          recordingId,
          time,
          type,
          typeData,

          // TODO [FE-1058] Delete legacy fields in favor of type/typeData
          networkRequestId: networkRequestId || null,
          position,
          primaryLabel,
          secondaryLabel,
          sourceLocation,
        },
      },
    });

    dispatch(setSelectedPrimaryPanel("comments"));
  };
}

export function createFrameComment(
  position: { x: number; y: number } | null,
  recordingId: RecordingId,
  typeData: VisualCommentTypeData | null
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
        position,
        hasFrames: true,
        sourceLocation: null,
        type: COMMENT_TYPE_VISUAL,
        typeData,
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
        type: COMMENT_TYPE_NETWORK_REQUEST,
        typeData: createTypeDataForNetworkRequestComment(
          request.id,
          request.method,
          request.name,
          request.status ?? null,
          request.point.time,
          request.type
        ),
      })
    );
  };
}

export function seekToComment(
  comment: Comment,
  sourceLocation: CommentSourceLocation | null,
  openSource: boolean
): UIThunkAction {
  return (dispatch, getState) => {
    let context = selectors.getThreadContext(getState());
    dispatch(seek(comment.point, comment.time, false));
    dispatch(setSelectedPrimaryPanel("comments"));

    if (sourceLocation) {
      context = selectors.getThreadContext(getState());
      dispatch(selectLocation(context, sourceLocation, openSource));
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
  const frame = await topFrameCache.readAsync(replayClient, pauseId);
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
