import { RecordingId } from "@replayio/protocol";
import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import { setSymbols } from "devtools/client/debugger/src/actions/sources/symbols";
import { getSymbols } from "devtools/client/debugger/src/reducers/ast";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { getTextAtLocation } from "devtools/client/debugger/src/reducers/sources";
import { findClosestFunction } from "devtools/client/debugger/src/utils/ast";
import {
  waitForEditor,
  getCodeMirror,
} from "devtools/client/debugger/src/utils/editor/create-editor";
import { getFilenameFromURL } from "devtools/client/debugger/src/utils/sources-tree/getURL";
import escapeHtml from "escape-html";
import type { ThreadFront as ThreadFrontType } from "protocol/thread";
import { waitForTime } from "protocol/utils";
import { Action } from "redux";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { selectors } from "ui/reducers";
import { getCurrentTime, getFocusRegion } from "ui/reducers/timeline";
import { PendingComment, Comment, Reply, SourceLocation, CommentOptions } from "ui/state/comments";
import { User } from "ui/types";

import { setSelectedPrimaryPanel } from "./layout";
import { seek } from "./timeline";

import type { UIThunkAction } from "./index";
import { endTimeForFocusRegion, isTimeInRegions, startTimeForFocusRegion } from "ui/utils/timeline";
import { getLoadedRegions } from "./app";

type SetPendingComment = Action<"set_pending_comment"> & { comment: PendingComment | null };
type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };
type UpdatePendingCommentContent = Action<"update_pending_comment_content"> & { content: string };

export type CommentsAction = SetPendingComment | SetHoveredComment | UpdatePendingCommentContent;

export function setPendingComment(comment: PendingComment): SetPendingComment {
  return { type: "set_pending_comment", comment };
}

export function setHoveredComment(comment: any): SetHoveredComment {
  return { type: "set_hovered_comment", comment };
}

export function clearPendingComment(): SetPendingComment {
  return { type: "set_pending_comment", comment: null };
}

export function updatePendingCommentContent(content: string): UpdatePendingCommentContent {
  return { type: "update_pending_comment_content", content };
}

export function createComment(
  time: number,
  point: string,
  user: User, // TODO: user is no longer required and should be removed
  recordingId: RecordingId,
  options: CommentOptions
): UIThunkAction {
  return async dispatch => {
    const { sourceLocation, hasFrames, position, networkRequestId } = options;
    const labels = sourceLocation ? await dispatch(createLabels(sourceLocation)) : undefined;
    const primaryLabel = labels?.primary;
    const secondaryLabel = labels?.secondary;

    // If a comment is saved to Apollo, it will be assigned a persisted ID.
    // Local, pending comments just need stable+unique IDs.
    // Avoid using createdAt or updatedAt in these IDs though as these values are not stable.
    const id = sourceLocation
      ? `${point}-${sourceLocation.sourceId}-${sourceLocation.line}`
      : `${point}`;

    const pendingComment: PendingComment = {
      type: "new_comment",
      comment: {
        content: "",
        createdAt: new Date().toISOString(),
        hasFrames,
        id,
        isUnpublished: true,
        networkRequestId: networkRequestId || null,
        point,
        position,
        primaryLabel,
        recordingId,
        replies: [],
        secondaryLabel,
        sourceLocation,
        time,
        updatedAt: new Date().toISOString(),
        user,
      },
    };

    dispatch(setSelectedPrimaryPanel("comments"));
    dispatch(setPendingComment(pendingComment));
  };
}

export function createFrameComment(
  time: number,
  point: string,
  position: { x: number; y: number } | null,
  user: User,
  recordingId: RecordingId,
  breakpoint?: any
): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    // Only try to generate a sourceLocation if there's a corresponding breakpoint for this
    // frame comment.
    const sourceLocation = breakpoint
      ? breakpoint.location || (await getCurrentPauseSourceLocationWithTimeout(ThreadFront))
      : null;
    const options = {
      position,
      hasFrames: true,
      sourceLocation: sourceLocation || null,
    };
    dispatch(createComment(time, point, user, recordingId, options));
  };
}

function getCurrentPauseSourceLocationWithTimeout(ThreadFront: typeof ThreadFrontType) {
  return Promise.race([ThreadFront.getCurrentPauseSourceLocation(), waitForTime(1000)]);
}

export function createFloatingCodeComment(
  time: number,
  point: string,
  user: User,
  recordingId: RecordingId,
  breakpoint: any
): UIThunkAction {
  return async dispatch => {
    const { location: sourceLocation } = breakpoint;
    const options = {
      position: null,
      hasFrames: false,
      sourceLocation: sourceLocation || null,
    };
    dispatch(createComment(time, point, user, recordingId, options));
  };
}

export function createNetworkRequestComment(
  request: RequestSummary,
  user: User,
  recordingId: RecordingId
): UIThunkAction {
  return async (dispatch, getState) => {
    const state = getState();
    const currentTime = getCurrentTime(state);
    const executionPoint = getExecutionPoint(state);

    const time = request.triggerPoint?.time ?? currentTime;
    const point = request.triggerPoint?.point || executionPoint!;

    const options = {
      position: null,
      hasFrames: false,
      sourceLocation: null,
      networkRequestId: request.id,
    };
    dispatch(createComment(time, point, user, recordingId, options));
  };
}

export function createLabels(
  sourceLocation: SourceLocation
): UIThunkAction<Promise<{ primary: string; secondary: string }>> {
  return async (dispatch, getState, { ThreadFront }) => {
    const { sourceId, sourceUrl, line } = sourceLocation;
    const filename = getFilenameFromURL(sourceUrl);
    if (!sourceId) {
      return { primary: `${filename}:${line}`, secondary: "" };
    }
    const state = getState();

    let symbols = getSymbols(state, { id: sourceId });
    if (!symbols) {
      symbols = await dispatch(setSymbols({ source: { id: sourceId } }));
    }
    const closestFunction = findClosestFunction(symbols, sourceLocation);
    const primary = closestFunction?.name || `${filename}:${line}`;

    let snippet = getTextAtLocation(state, sourceId, sourceLocation) || "";
    if (!snippet) {
      const sourceContent = await ThreadFront.getSourceContents(sourceId);
      const lineText = sourceContent.contents.split("\n")[line - 1];
      snippet = lineText?.slice(0, 100).trim();
    }
    let secondary = "";
    if (snippet) {
      await waitForEditor();
      const CodeMirror = getCodeMirror();
      CodeMirror.runMode(snippet, "javascript", (text: string, className: string | null) => {
        const openingTag = className ? `<span class="cm-${className}">` : "<span>";
        secondary += `${openingTag}${escapeHtml(text)}</span>`;
      });
    }
    return { primary, secondary };
  };
}

export function seekToComment(item: Comment | Reply | PendingComment["comment"]): UIThunkAction {
  return (dispatch, getState) => {
    dispatch(clearPendingComment());

    let context = selectors.getThreadContext(getState());
    dispatch(seek(item.point, item.time, item.hasFrames));
    dispatch(setSelectedPrimaryPanel("comments"));

    if (item.sourceLocation) {
      const regions = getLoadedRegions(getState());
      const isTimeInLoadedRegion = regions !== null && isTimeInRegions(item.time, regions.loaded);
      if (isTimeInLoadedRegion) {
        context = selectors.getThreadContext(getState());
        dispatch(selectLocation(context, item.sourceLocation));
      }
    }
  };
}
