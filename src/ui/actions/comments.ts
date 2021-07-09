import { Action } from "redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { PendingComment, Event, Comment, Reply } from "ui/state/comments";
import { UIThunkAction } from ".";
import { ThreadFront } from "protocol/thread";
import { setSelectedPrimaryPanel } from "./app";
import escapeHtml from "escape-html";
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
type SetShouldShowLoneEvents = Action<"set_should_show_lone_events"> & { value: boolean };

export type CommentsAction = SetPendingComment | SetHoveredComment | SetShouldShowLoneEvents;

export function setPendingComment(comment: PendingComment): SetPendingComment {
  return { type: "set_pending_comment", comment };
}

export function setHoveredComment(comment: any): SetHoveredComment {
  return { type: "set_hovered_comment", comment };
}

export function clearPendingComment(): SetPendingComment {
  return { type: "set_pending_comment", comment: null };
}

export function toggleShowLoneEvents(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const newValue = !selectors.getShouldShowLoneEvents(getState());
    dispatch({ type: "set_should_show_lone_events", value: newValue });
  };
}

export function createComment(
  time: number,
  point: string,
  position: { x: number; y: number } | null
): UIThunkAction {
  return async ({ dispatch }) => {
    dispatch(setSelectedPrimaryPanel("comments"));

    const sourceLocation = await ThreadFront.getCurrentPauseSourceLocation();
    const labels = sourceLocation ? await dispatch(createLabels(sourceLocation)) : undefined;

    const pendingComment: PendingComment = {
      type: "new_comment",
      comment: {
        content: "",
        primaryLabel: labels?.primary || null,
        secondaryLabel: labels?.secondary || null,
        time,
        point,
        hasFrames: ThreadFront.currentPointHasFrames,
        sourceLocation: sourceLocation || null,
        position,
      },
    };

    dispatch(setPendingComment(pendingComment));
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

export function editItem(item: Comment | Reply): UIThunkAction {
  return async ({ dispatch }) => {
    const { point, time, hasFrames } = item;

    dispatch(seekToComment(item));

    if (!("replies" in item)) {
      const { content, sourceLocation, parentId, position, id } = item;

      // Editing a reply.
      const pendingComment: PendingComment = {
        type: "edit_reply",
        comment: { content, time, point, hasFrames, sourceLocation, parentId, position, id },
      };
      dispatch(setPendingComment(pendingComment));
    } else {
      const { content, primaryLabel, secondaryLabel, sourceLocation, id, position } = item;

      // Editing a comment.
      const pendingComment: PendingComment = {
        type: "edit_comment",
        comment: {
          content,
          primaryLabel,
          secondaryLabel,
          time,
          point,
          hasFrames,
          sourceLocation,
          id,
          position,
        },
      };
      dispatch(setPendingComment(pendingComment));
    }
  };
}

export function seekToComment(
  item: Comment | Reply | Event | PendingComment["comment"]
): UIThunkAction {
  return ({ dispatch, getState }) => {
    dispatch(clearPendingComment());

    let cx = selectors.getThreadContext(getState());
    const hasFrames = "hasFrames" in item ? item.hasFrames : false;
    dispatch(actions.seek(item.point, item.time, hasFrames));
    if ("sourceLocation" in item && item.sourceLocation) {
      cx = selectors.getThreadContext(getState());
      dispatch(actions.selectLocation(cx, item.sourceLocation));
    }
  };
}

export function replyToComment(comment: Comment): UIThunkAction {
  return ({ dispatch }) => {
    const { time, point, hasFrames, id } = comment;
    const pendingComment: PendingComment = {
      type: "new_reply",
      comment: {
        content: "",
        time,
        point,
        hasFrames,
        sourceLocation: null,
        parentId: id,
      },
    };

    dispatch(setPendingComment(pendingComment));
  };
}
