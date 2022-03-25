import { Action } from "redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { Comment, SourceLocation, PendingCommentData } from "ui/state/comments";
import { UIThunkAction } from ".";
import { ThreadFront } from "protocol/thread";
import escapeHtml from "escape-html";
import { waitForTime } from "protocol/utils";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
import { RecordingId, TimeStampedPoint } from "@recordreplay/protocol";
import { User } from "ui/types";
import { setSelectedPrimaryPanel } from "./layout";
import { getCurrentTime, getFocusRegion } from "ui/reducers/timeline";
import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";
import { Breakpoint } from "devtools/client/debugger/src/reducers/breakpoints";
const { getFilenameFromURL } = require("devtools/client/debugger/src/utils/sources-tree/getURL");
const { getTextAtLocation } = require("devtools/client/debugger/src/reducers/sources");
const { findClosestFunction } = require("devtools/client/debugger/src/utils/ast");
const { getSymbols } = require("devtools/client/debugger/src/reducers/ast");
const { setSymbols } = require("devtools/client/debugger/src/actions/sources/symbols");
const {
  waitForEditor,
  getCodeMirror,
} = require("devtools/client/debugger/src/utils/editor/create-editor");

type SetPendingCommentData = Action<"set_pending_comment_data"> & {
  parentId: Comment["id"] | null;
  data: PendingCommentData | null;
};
type SetHoveredComment = Action<"set_hovered_comment"> & { comment: any };

export type CommentsAction = SetPendingCommentData | SetHoveredComment;

export function setPendingCommentData(
  parentId: Comment["id"] | null,
  data: PendingCommentData | null
): SetPendingCommentData {
  return { type: "set_pending_comment_data", parentId, data };
}

export function setHoveredComment(comment: any): SetHoveredComment {
  return { type: "set_hovered_comment", comment };
}

export function createComment(
  parentId: Comment["id"] | null,
  pendingCommentData: PendingCommentData
): UIThunkAction {
  return async dispatch => {
    // const { sourceLocation, hasFrames, position, networkRequestId } = pendingCommentData;
    // const labels = sourceLocation ? await dispatch(createLabels(sourceLocation)) : undefined;
    // const primaryLabel = labels?.primary;
    // const secondaryLabel = labels?.secondary;
    // const pendingComment: PendingComment = {
    //   type: "new_comment",
    //   comment: {
    //     content: "",
    //     createdAt: new Date().toISOString(),
    //     hasFrames,
    //     id: PENDING_COMMENT_ID,
    //     networkRequestId: networkRequestId || null,
    //     point,
    //     position,
    //     primaryLabel,
    //     recordingId,
    //     replies: [],
    //     secondaryLabel,
    //     sourceLocation,
    //     time,
    //     updatedAt: new Date().toISOString(),
    //     user,
    //   },
    // };
    // addPendingCommentData(parentId, pendingCommentData);
    // dispatch(setSelectedPrimaryPanel("comments"));
    // dispatch(setPendingComment(pendingComment));
  };
}

export function createFrameComment({
  time,
  point,
  position,
  breakpoint,
}: {
  time: number;
  point: string;
  position: { x: number; y: number } | null;
  breakpoint?: Breakpoint;
}): UIThunkAction {
  return async dispatch => {
    const sourceLocation =
      breakpoint?.location || (await getCurrentPauseSourceLocationWithTimeout());

    // set data for pending top-level comment (currently not setting ever for
    // non-top-level comments)
    dispatch(
      setPendingCommentData(null, {
        time,
        point,
        position,
        hasFrames: true,
        sourceLocation: sourceLocation || null,
        networkRequestId: null,
      })
    );
  };
}

function getCurrentPauseSourceLocationWithTimeout() {
  return Promise.race([ThreadFront.getCurrentPauseSourceLocation(), waitForTime(1000)]);
}

export function createFloatingCodeComment({
  time,
  point,
  breakpoint,
}: {
  time: number;
  point: string;
  breakpoint: Breakpoint;
}): UIThunkAction {
  return async dispatch => {
    // set data for pending top-level comment (currently not setting ever for
    // non-top-level comments)
    dispatch(
      setPendingCommentData(null, {
        time,
        point,
        position: null,
        hasFrames: false,
        sourceLocation: breakpoint.location ?? null,
        networkRequestId: null,
      })
    );
  };
}

export function createNetworkRequestComment({
  request,
}: {
  request: RequestSummary;
}): UIThunkAction {
  return async (dispatch, getState) => {
    const state = getState();
    const currentTime = getCurrentTime(state);
    const executionPoint = getExecutionPoint(state);

    const time = request.triggerPoint?.time ?? currentTime;
    const point = request.triggerPoint?.point || executionPoint!;

    // set data for pending top-level comment (currently not setting ever for
    // non-top-level comments)
    dispatch(
      setPendingCommentData(null, {
        time,
        point,
        position: null,
        hasFrames: false,
        sourceLocation: null,
        networkRequestId: request.id,
      })
    );
  };
}

export function createLabels(sourceLocation: {
  sourceId: string;
  sourceUrl: string;
  line: number;
}): UIThunkAction<Promise<{ primary: string; secondary: string }>> {
  return async (dispatch, getState) => {
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

export function seekToComment(comment: Comment): UIThunkAction {
  return (dispatch, getState) => {
    dispatch(setPendingCommentData(null, null));
    const focusRegion = getFocusRegion(getState());

    if (
      focusRegion &&
      (comment.time < focusRegion.startTime || comment.time > focusRegion.endTime)
    ) {
      console.error("Cannot seek outside the current focused region", focusRegion, comment);
      return;
    }

    let cx = selectors.getThreadContext(getState());
    dispatch(actions.seek(comment.point, comment.time, comment.hasFrames));
    dispatch(actions.setSelectedPrimaryPanel("comments"));
    if (comment.sourceLocation) {
      cx = selectors.getThreadContext(getState());
      dispatch(actions.selectLocation(cx, comment.sourceLocation));
    }
  };
}
