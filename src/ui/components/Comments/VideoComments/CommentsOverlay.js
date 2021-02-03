import React from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import hooks from "ui/hooks";
import VideoComment from "./VideoComment";
import "./CommentsOverlay.css";

function CommentsOverlay({ pendingComment, canvas, recordingId, currentTime, setHoveredComment }) {
  const { comments: hasuraComments } = hooks.useGetComments(recordingId);

  console.log({ hasuraComments });

  if (!canvas) {
    return null;
  }

  const { top, left, width, height, scale } = canvas;

  let comments = [...hasuraComments];

  // We replace the hasuraComment that's currently being edited with our own
  // pendingComment. This lets us update the pendingComment as the user
  // move the location marker around the video and have it visually update
  // the displayed comments.
  if (pendingComment) {
    comments = hasuraComments.filter(comment => pendingComment?.id != comment.id);
    comments.push(pendingComment);
  }

  const commentsAtTime = comments.filter(
    comment => comment && comment.position && comment.time == currentTime
  );

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
      </div>
    </div>
  );
}

export default connect(
  state => ({
    currentTime: selectors.getCurrentTime(state),
    pendingComment: selectors.getPendingComment(state),
    recordingId: selectors.getRecordingId(state),
    canvas: selectors.getCanvas(state),
  }),
  {
    setHoveredComment: actions.setHoveredComment,
  }
)(CommentsOverlay);
