import React from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import VideoComment from "./VideoComment";
import "./CommentsOverlay.css";

function findComment({ hasuraComments, pendingComment, hoveredComment, currentTime }) {
  let comments = [...hasuraComments];

  // We replace the hasuraComment that's currently being edited with our own
  // pendingComment. This lets us update the pendingComment as the user
  // move the location marker around the video and have it visually update
  // the displayed comments.
  if (pendingComment) {
    comments = hasuraComments.filter(comment => pendingComment?.comment.id != comment.id);
    comments.push(pendingComment.comment);
  }

  // Find the comment that matches the hoveredComment ID
  // if (hoveredComment) {
  //   return comments.find(comment => comment.id == hoveredComment);
  // }

  // Find the comment at the current position
  return comments.filter(comment => comment && comment.position && comment.time == currentTime);
}

function CommentsOverlay({
  pendingComment,
  canvas,
  recordingId,
  hoveredComment,
  currentTime,
  setHoveredComment,
  children,
}) {
  const { comments: hasuraComments } = hooks.useGetComments(recordingId);

  if (!canvas) {
    return null;
  }

  const { top, left, width, height, scale } = canvas;
  const comments = findComment({ hasuraComments, pendingComment, currentTime, hoveredComment });

  return (
    <div
      className="canvas-overlay"
      style={{
        top: top,
        left: left,
        width: width * scale,
        height: height * scale,
      }}
    >
      <div className="canvas-comments">
        {comments.map(comment => (
          <VideoComment
            comment={comment}
            scale={scale}
            setHoveredComment={setHoveredComment}
            key={"id" in comment ? comment.id : "pendingCommentId"}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

export default connect(
  state => ({
    hoveredComment: selectors.getHoveredComment(state),
    currentTime: selectors.getCurrentTime(state),
    pendingComment: selectors.getPendingComment(state),
    recordingId: selectors.getRecordingId(state),
    canvas: selectors.getCanvas(state),
  }),
  {
    setHoveredComment: actions.setHoveredComment,
  }
)(CommentsOverlay);
