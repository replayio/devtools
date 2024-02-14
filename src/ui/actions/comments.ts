import { RecordingId } from "@replayio/protocol";

import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import {
  COMMENT_TYPE_NETWORK_REQUEST,
  COMMENT_TYPE_VISUAL,
  VisualCommentTypeData,
  createTypeDataForNetworkRequestComment,
  isNetworkRequestComment,
  isSourceCodeComment,
} from "replay-next/components/sources/utils/comments";
import { mutate } from "shared/graphql/apolloClient";
import { Comment, CommentType } from "shared/graphql/types";
import { selectNetworkRequest } from "ui/actions/network";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { ADD_COMMENT_MUTATION, AddCommentMutation } from "ui/hooks/comments/useAddComment";
import { selectors } from "ui/reducers";
import { getCurrentTime } from "ui/reducers/timeline";
import { trackEvent } from "ui/utils/telemetry";

import type { UIThunkAction } from "./index";
import { setSelectedPrimaryPanel } from "./layout";
import { seek } from "./timeline";

type CommentOptions = {
  hasFrames: boolean;
  type: CommentType;
  typeData: any | null;
};

export function createComment(
  time: number,
  point: string,
  recordingId: RecordingId,
  options: CommentOptions
): UIThunkAction {
  return async dispatch => {
    let { hasFrames, type, typeData } = options;

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
        hasFrames: true,
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
        hasFrames: false,
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

export function seekToComment(comment: Comment, openSource: boolean): UIThunkAction {
  return (dispatch, getState) => {
    dispatch(
      seek({
        executionPoint: comment.point,
        openSource: false,
        time: comment.time,
      })
    );

    dispatch(setSelectedPrimaryPanel("comments"));

    if (isSourceCodeComment(comment)) {
      const context = selectors.getThreadContext(getState());
      dispatch(
        selectLocation(
          context,
          {
            sourceId: comment.typeData.sourceId,
            line: comment.typeData.lineNumber,
            column: comment.typeData.columnIndex,
            sourceUrl: comment.typeData.sourceUrl || undefined,
          },
          openSource
        )
      );
    } else if (isNetworkRequestComment(comment)) {
      dispatch(selectNetworkRequest(comment.typeData.id));
    }
  };
}
