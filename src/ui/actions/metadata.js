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
      ...(newComments || [])
        .filter(comment => {
          // Ignore the comment for our own location.
          return comment.id != ThreadFront.sessionId;
        })
        .map(comment => {
          return { ...comment, visible: isServerCommentVisible(existingComments, comment) };
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
      visible: true,
      point: ThreadFront.currentPoint,
      hasFrames: ThreadFront.currentPointHasFrames,
      time: currentTime,
      contents: "",
      saved: false,
    };

    dispatch({
      type: "set_comments",
      comments: [...existingComments, comment],
    });
  };
}

export function updateComment(comment) {
  return ({ dispatch }) => {
    if (comment.contents) {
      comment.saved = true;
      ThreadFront.updateMetadata(CommentsMetadata, comments => [
        ...(comments || []).filter(c => c.id != comment.id),
        comment,
      ]);
    } else {
      if (comment.saved) {
        ThreadFront.updateMetadata(CommentsMetadata, comments =>
          (comments || []).filter(c => c.id != comment.id)
        );
      }
      dispatch(removeComment(comment));
    }
  };
}

export function closeComment() {
  return ({ dispatch }) => {
    if (comment.saved) {
      dispatch(setCommentsVisible([comment], false));
    } else {
      dispatch(removeComment(comment));
    }
  };
}

function setCommentsVisible(list, visible) {
  return ({ dispatch, getState }) => {
    const existingComments = selectors.getComments(getState());

    const comments = existingComments.map(c => {
      if (list.some(c2 => c2.id == c.id)) {
        return { ...c, visible };
      }
      return c;
    });

    dispatch({ type: "set_comments", comments });
  };
}

export function jumpToComment(comment) {
  ThreadFront.timeWarp(comment.point, comment.time, comment.hasFrames);
}

export function removeComment(comment) {
  return ({ getState, dispatch }) => {
    const comments = selectors.getComments(getState());
    const newComments = comments.filter(c => c.id != comment.id);
    dispatch({ type: "set_comments", comments: newComments });
    //   removeOldCommentElements(comments);
  };
}
