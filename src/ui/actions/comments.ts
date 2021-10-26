import { Action } from "redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { PendingComment, Comment, Reply, SourceLocation } from "ui/state/comments";
import { UIThunkAction } from ".";
import { ThreadFront } from "protocol/thread";
import { setSelectedPrimaryPanel } from "./app";
import escapeHtml from "escape-html";
import { waitForTime } from "protocol/utils";
import { PENDING_COMMENT_ID } from "ui/reducers/comments";
const { getFilenameFromURL } = require("devtools/client/debugger/src/utils/sources-tree/getURL");
const { getTextAtLocation } = require("devtools/client/debugger/src/reducers/sources");
const { findClosestFunction } = require("devtools/client/debugger/src/utils/ast");
const { getSymbols } = require("devtools/client/debugger/src/reducers/ast");
const { setSymbols } = require("devtools/client/debugger/src/actions/sources/symbols");
const {
  waitForEditor,
  getCodeMirror,
} = require("devtools/client/debugger/src/utils/editor/create-editor");

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
  position: { x: number; y: number } | null,
  hasFrames: boolean,
  sourceLocation: SourceLocation | null
): UIThunkAction {
  return async ({ dispatch }) => {
    const labels = sourceLocation ? await dispatch(createLabels(sourceLocation)) : undefined;
    const primaryLabel = labels?.primary;
    const secondaryLabel = labels?.secondary;

    const pendingComment: PendingComment = {
      type: "new_comment",
      comment: {
        content: "",
        createdAt: new Date().toISOString(),
        hasFrames,
        id: PENDING_COMMENT_ID,
        point,
        position,
        primaryLabel,
        replies: [],
        secondaryLabel,
        sourceLocation,
        time,
        updatedAt: new Date().toISOString(),
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
  breakpoint?: any
): UIThunkAction {
  return async ({ dispatch }) => {
    const sourceLocation =
      breakpoint?.location || (await getCurrentPauseSourceLocationWithTimeout());
    dispatch(createComment(time, point, position, true, sourceLocation || null));
  };
}

function getCurrentPauseSourceLocationWithTimeout() {
  return Promise.race([ThreadFront.getCurrentPauseSourceLocation(), waitForTime(1000)]);
}

export function createFloatingCodeComment(
  time: number,
  point: string,
  breakpoint: any
): UIThunkAction {
  return async ({ dispatch }) => {
    const { location: sourceLocation } = breakpoint;
    dispatch(createComment(time, point, null, false, sourceLocation || null));
  };
}

export function createLabels(sourceLocation: {
  sourceId: string;
  sourceUrl: string;
  line: number;
}): UIThunkAction<Promise<{ primary: string; secondary: string }>> {
  return async ({ getState, dispatch }) => {
    const { sourceUrl, line } = sourceLocation;
    const filename = getFilenameFromURL(sourceUrl);
    const state = getState();

    let symbols = getSymbols(state, { id: sourceLocation.sourceId });
    if (!symbols) {
      symbols = await dispatch(setSymbols({ source: { id: sourceLocation.sourceId } }));
    }
    const closestFunction = findClosestFunction(symbols, sourceLocation);
    const primary = closestFunction?.name || `${filename}:${line}`;

    let snippet = getTextAtLocation(state, sourceLocation.sourceId, sourceLocation) || "";
    if (!snippet) {
      const sourceContent = await ThreadFront.getSourceContents(sourceLocation.sourceId);
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

export function editItem(item: Reply | Comment): UIThunkAction {
  return async ({ dispatch }) => {
    const { point, time, hasFrames } = item;

    dispatch(seekToComment(item));

    if (!("replies" in item)) {
      const pendingComment: PendingComment = {
        comment: item,
        type: "edit_reply",
      };
      dispatch(setPendingComment(pendingComment));
    } else {
      const pendingComment: PendingComment = {
        comment: item,
        type: "edit_comment",
      };
      dispatch(setPendingComment(pendingComment));
    }
  };
}

export function seekToComment(item: Comment | Reply | PendingComment["comment"]): UIThunkAction {
  return ({ dispatch, getState }) => {
    dispatch(clearPendingComment());

    let cx = selectors.getThreadContext(getState());
    dispatch(actions.seek(item.point, item.time, item.hasFrames));
    if (item.sourceLocation) {
      cx = selectors.getThreadContext(getState());
      dispatch(actions.selectLocation(cx, item.sourceLocation));
    }
  };
}

export function replyToComment(parentId: string, point: string, time: number): UIThunkAction {
  return ({ dispatch }) => {
    const pendingComment: PendingComment = {
      type: "new_reply",
      comment: {
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        id: PENDING_COMMENT_ID,
        hasFrames: false,
        sourceLocation: null,
        parentId,
        point,
        time,
      },
    };

    dispatch(setPendingComment(pendingComment));
  };
}
