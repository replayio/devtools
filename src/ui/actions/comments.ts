import { RecordingId } from "@replayio/protocol";
import {
  handleUnstableSourceIds,
  selectLocation,
} from "devtools/client/debugger/src/actions/sources/select";
import { fetchSymbolsForSource, getSymbols } from "devtools/client/debugger/src/reducers/ast";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import {
  getPreferredSourceId,
  getSourceDetailsEntities,
  getTextAtLocation,
} from "ui/reducers/sources";
import { findClosestFunction } from "devtools/client/debugger/src/utils/ast";
import {
  waitForEditor,
  getCodeMirror,
} from "devtools/client/debugger/src/utils/editor/create-editor";
import { getFilenameFromURL } from "devtools/client/debugger/src/utils/sources-tree/getURL";
import escapeHtml from "escape-html";
import type { ThreadFront as ThreadFrontType } from "protocol/thread";
import { waitForTime } from "protocol/utils";
import { Action } from "@reduxjs/toolkit";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { AddCommentMutation, ADD_COMMENT_MUTATION } from "ui/hooks/comments/useAddComment";
import { selectors } from "ui/reducers";
import { getCurrentTime } from "ui/reducers/timeline";
import { Comment, Reply, SourceLocation, CommentOptions } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";
import { mutate } from "ui/utils/apolloClient";

import type { UIThunkAction } from "./index";
import { setSelectedPrimaryPanel } from "./layout";
import { seek } from "./timeline";
import { UIState } from "ui/state";

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
  return async (dispatch, getState, { ThreadFront }) => {
    const state = getState();
    const currentTime = getCurrentTime(state);
    const executionPoint = getExecutionPoint(state);

    // Only try to generate a sourceLocation if there's a corresponding breakpoint for this frame comment.
    const sourceLocation = breakpoint
      ? breakpoint.location ||
        (await getCurrentPauseSourceLocationWithTimeout(ThreadFront, getState))
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
  getState: () => UIState
) {
  return Promise.race([getCurrentPauseSourceLocation(ThreadFront, getState), waitForTime(1000)]);
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
    const state = getState();

    const sourceId = handleUnstableSourceIds(sourceLocation.sourceUrl, state);

    if (sourceId) {
      sourceLocation.sourceId = sourceId;
    }

    const { sourceUrl, line } = sourceLocation;

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
      const sourceContent = await replayClient.getSourceContents(sourceId);
      const lineText = sourceContent.contents.split("\n")[line - 1];
      snippet = lineText?.slice(0, 100).trim();
    }
    let secondary = "";
    if (snippet) {
      await waitForEditor();
      const CodeMirror = getCodeMirror();
      // @ts-expect-error runMode doesn't exist on CodeMirror
      CodeMirror.runMode(snippet, "javascript", (text: string, className: string | null) => {
        const openingTag = className ? `<span class="cm-${className}">` : "<span>";
        secondary += `${openingTag}${escapeHtml(text)}</span>`;
      });
    }
    return { primary, secondary };
  };
}

export function seekToComment(item: Comment | Reply): UIThunkAction {
  return (dispatch, getState) => {
    let context = selectors.getThreadContext(getState());
    dispatch(seek(item.point, item.time, item.hasFrames));
    dispatch(setSelectedPrimaryPanel("comments"));

    if (item.sourceLocation) {
      context = selectors.getThreadContext(getState());
      dispatch(selectLocation(context, item.sourceLocation));
    }
  };
}

async function getCurrentPauseSourceLocation(
  ThreadFront: typeof ThreadFrontType,
  getState: () => UIState
) {
  const frame = (await ThreadFront.currentPause?.getFrames())?.[0];
  if (!frame) {
    return;
  }
  await ThreadFront.ensureAllSources();
  const sourcesById = getSourceDetailsEntities(getState());
  const { location } = frame;
  const preferredSourceId = getPreferredSourceId(
    sourcesById,
    location.map(l => l.sourceId),
    ThreadFront.preferredGeneratedSources
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
