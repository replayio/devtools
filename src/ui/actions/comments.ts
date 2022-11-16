import { Action } from "@reduxjs/toolkit";
import { RecordingId } from "@replayio/protocol";

import { getFramesAsync } from "bvaughn-architecture-demo/src/suspense/FrameCache";
import { getStreamingSourceContentsHelper } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import { parse } from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";
import {
  handleUnstableSourceIds,
  selectLocation,
} from "devtools/client/debugger/src/actions/sources/select";
import { fetchSymbolsForSource, getSymbols } from "devtools/client/debugger/src/reducers/ast";
import { getExecutionPoint, getPauseId } from "devtools/client/debugger/src/reducers/pause";
import { findClosestFunction } from "devtools/client/debugger/src/utils/ast";
import { getFilenameFromURL } from "devtools/client/debugger/src/utils/sources-tree/getURL";
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
  getTextAtLocation,
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
  point: string | null,
  recordingId: RecordingId,
  options: CommentOptions
): UIThunkAction {
  return async dispatch => {
    const { sourceLocation, hasFrames, position, networkRequestId } = options;
    const labels = sourceLocation ? await dispatch(createLabels(sourceLocation)) : undefined;
    const primaryLabel = labels?.primary;
    const secondaryLabel = labels?.secondary;

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
  breakpoint?: any
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront, replayClient }) => {
    const state = getState();
    const currentTime = getCurrentTime(state);
    const executionPoint = getExecutionPoint(state);

    // Only try to generate a sourceLocation if there's a corresponding breakpoint for this frame comment.
    const sourceLocation = breakpoint
      ? breakpoint.location ||
        (await getCurrentPauseSourceLocationWithTimeout(ThreadFront, replayClient, getState))
      : null;

    dispatch(
      createComment(currentTime, executionPoint, recordingId, {
        position,
        hasFrames: true,
        sourceLocation: sourceLocation || null,
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
  return async (dispatch, getState) => {
    const state = getState();
    const currentTime = getCurrentTime(state);
    const executionPoint = getExecutionPoint(state);

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
  return async (dispatch, getState) => {
    const state = getState();
    const time = request.triggerPoint?.time ?? getCurrentTime(state);
    const executionPoint = request.triggerPoint?.point || getExecutionPoint(state);

    dispatch(
      createComment(time, executionPoint, recordingId, {
        position: null,
        hasFrames: false,
        sourceLocation: null,
        networkRequestId: request.id,
      })
    );
  };
}

export function createLabels(
  sourceLocation: SourceLocation
): UIThunkAction<Promise<{ primary: string; secondary: string }>> {
  return async (dispatch, getState, { ThreadFront, replayClient }) => {
    await ThreadFront.ensureAllSources();
    const state = getState();

    const { line, sourceUrl } = sourceLocation;

    let sourceId: string | null = sourceLocation.sourceId || null;

    // If there's a source URL, we should use it to find the source ID.
    // Otherwise fall back to the source ID we already have.
    if (sourceUrl) {
      const alternateSourceId = handleUnstableSourceIds(sourceLocation.sourceUrl, state);
      if (alternateSourceId) {
        sourceId = alternateSourceId;
        sourceLocation = {
          ...sourceLocation,
          sourceId: alternateSourceId,
        };
      }
    }

    const filename = sourceUrl ? getFilenameFromURL(sourceUrl) : "unknown source";

    if (!sourceId) {
      return { primary: `${filename}:${line}`, secondary: "" };
    }

    let symbols = getSymbols(state, { id: sourceId });
    if (!symbols) {
      await dispatch(fetchSymbolsForSource(sourceId));
      // TODO Technically a small race condition here if the symbols were already loading,
      // but given where `createLabels` is called I'm not going to worry about it
      symbols = getSymbols(state, { id: sourceId });
    }
    const closestFunction = findClosestFunction(symbols!, sourceLocation);
    const primary = closestFunction?.name || `${filename}:${line}`;

    let snippet = getTextAtLocation(state, sourceLocation) || "";
    if (!snippet) {
      const { resolver } = await getStreamingSourceContentsHelper(replayClient, sourceId);
      const { contents } = await resolver;

      const lineText = contents!.split("\n")[line - 1];
      snippet = lineText?.slice(0, 100).trim();
    }

    let secondary = "";
    if (snippet) {
      const parsed = parse(snippet, ".js");
      if (parsed !== null && parsed.length > 0) {
        secondary = parsed[0];
      }
    }

    return { primary, secondary };
  };
}

export function seekToComment(item: Comment | Reply, openSourcesTab: boolean): UIThunkAction {
  return (dispatch, getState) => {
    let context = selectors.getThreadContext(getState());
    dispatch(seek(item.point, item.time, false));
    dispatch(setSelectedPrimaryPanel("comments"));

    if (item.sourceLocation) {
      context = selectors.getThreadContext(getState());
      dispatch(selectLocation(context, item.sourceLocation, openSourcesTab));
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
