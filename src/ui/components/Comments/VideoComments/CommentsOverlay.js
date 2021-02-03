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
  const { comments } = hooks.useGetComments(recordingId);

  if (!canvas) {
    return null;
  }

  const { top, left, width, height, scale } = canvas;
  const commentsWithPosition = [...comments]
    .filter(
      comment => comment?.position && JSON.parse(comment.position) && comment.time == currentTime
    )
    .filter(comment => comment.id !== activeComment?.id);

  console.log({ commentsWithPosition, pendingComment, activeComment });

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
        {commentsWithPosition.map((comment, i) => (
          <VideoComment
            comment={comment}
            scale={scale}
            key={i}
            setHoveredComment={setHoveredComment}
            shouldParsePosition
          />
        ))}
        {pendingComment ? (
          <VideoComment comment={pendingComment} scale={scale} setHoveredComment={() => {}} />
        ) : null}
        {activeComment ? (
          <VideoComment
            comment={activeComment}
            scale={scale}
            setHoveredComment={() => {}}
            shouldParsePosition
          />
        ) : null}
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
