import React from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import VideoComment from "./VideoComment";
import "./CommentsOverlay.css";

function CommentsOverlay({
  pendingComment,
  activeComment,
  canvas,
  recordingId,
  currentTime,
  setHoveredComment,
}) {
  const { comments: hasuraComments } = hooks.useGetComments(recordingId);

  if (!canvas) {
    return null;
  }

  const { top, left, width, height, scale } = canvas;
  const comments = [...hasuraComments];

  // New comments that haven't been sent to Hasura will not have an associated ID.
  // They're not included in the comments data from the query, so we have to insert
  // them manually here. If a pending comment has an ID, it already exists in the
  // comments data and we don't have to insert it.
  if (pendingComment && !pendingComment.id) {
    comments.push(pendingComment);
  }

  const commentsAtTime = comments.filter(comment => comment && comment.time == currentTime);

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
        {commentsAtTime.map((comment, i) => (
          <VideoComment
            comment={comment}
            scale={scale}
            key={i}
            setHoveredComment={setHoveredComment}
          />
        ))}
        {/* {pendingComment ? (
          <VideoComment comment={pendingComment} scale={scale} setHoveredComment={() => {}} />
        ) : null} */}
        {/* {activeComment ? (
          <VideoComment comment={activeComment} scale={scale} setHoveredComment={() => {}} />
        ) : null} */}
      </div>
    </div>
  );
}

export default connect(
  state => ({
    currentTime: selectors.getCurrentTime(state),
    pendingComment: selectors.getPendingComment(state),
    activeComment: selectors.getActiveComment(state),
    recordingId: selectors.getRecordingId(state),
    canvas: selectors.getCanvas(state),
  }),
  {
    setHoveredComment: actions.setHoveredComment,
  }
)(CommentsOverlay);
