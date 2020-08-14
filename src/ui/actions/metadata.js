import { ThreadFront } from "protocol/thread";
import { selectors } from "../reducers";

// Metadata key used to store comments.
const CommentsMetadata = "devtools-comments";

export function setupMetadata(recordingId, store) {
  ThreadFront.watchMetadata(CommentsMetadata, args => store.dispatch(onCommentsUpdate(args)));
}

function isServerCommentVisible(comments, comment) {
  // Comments are visible by default, unless they have been closed in
  // the local session. Ignore the visible value we get from the server.
  return !comments.some(c => c.id == comment.id && !c.visible);
}

function onCommentsUpdate(newComments) {
  return ({ getState, dispatch }) => {
    const existingComments = selectors.getComments(getState());

    const comments = [
      ...(newComments || []).filter(comment => {
        // Ignore the comment for our own location.
        return comment.id != ThreadFront.sessionId;
      }),
      ...existingComments.filter(c => !c.saved),
    ];

    dispatch({ type: "set_comments", comments });
  };
  //   removeOldCommentElements(comments);
}

export function createComment() {
  return ({ getState, dispatch }) => {
    // const { comments, currentTime } = this.state;
    const existingComments = selectors.getComments(getState());
    const currentTime = selectors.getCurrentTime(getState());

    const comment = {
      id: (Math.random() * 1e9) | 0,
      visible: false,
      point: ThreadFront.currentPoint,
      hasFrames: ThreadFront.currentPointHasFrames,
      time: currentTime,
      contents: "",
      saved: true,
    };

    const newComments = [...existingComments, comment];

    ThreadFront.updateMetadata(CommentsMetadata, () => newComments);

    dispatch({
      type: "set_comments",
      comments: newComments,
    });
  };
}

export function jumpToComment(comment) {
  ThreadFront.timeWarp(comment.point, comment.time, comment.hasFrames);
}

export function removeComment(comment) {
  return ({ getState, dispatch }) => {
    const comments = selectors.getComments(getState());
    const newComments = comments.filter(c => c.id != comment.id);
  };
}

export function updateComment(comment) {
  return ({ dispatch, getState }) => {
    const existingComments = selectors.getComments(getState());

    const commentIndex = existingComments.findIndex(c => c.id === comment.id);
    const newComments = [...existingComments];
    newComments.splice(commentIndex, 1, comment);
    dispatch(updateComments(newComments));
  };
}

export function updateComments(comments) {
  return ({ dispatch }) => {
    ThreadFront.updateMetadata(CommentsMetadata, () => comments);
    dispatch({ type: "set_comments", comments: comments });
  };
}

export function showComment(comment) {
  return ({ dispatch, getState }) => {
    const existingComments = selectors.getComments(getState());
    const newComments = existingComments.map(c => ({ ...c, visible: c.id === comment.id }));
    dispatch(updateComments(newComments));
  };
}

export function hideComments() {
  return ({ dispatch, getState }) => {
    const existingComments = selectors.getComments(getState());
    const newComments = existingComments.map(c => ({ ...c, visible: false }));
    dispatch(updateComments(newComments));
  };
}

export function clearComments() {
  return ({ dispatch }) => {
    ThreadFront.updateMetadata(CommentsMetadata, () => []);
    dispatch({ type: "set_comments", comments: [] });
  };
}
