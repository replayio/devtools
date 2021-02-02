import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import "./CommentsOverlay.css";

function CommentsOverlay({ pendingComment, canvas, recordingId, currentTime }) {
  const { comments } = hooks.useGetComments(recordingId);

  if (!canvas || (!comments.length && !pendingComment)) {
    return null;
  }

  const { top, left, width, height, scale, gDevicePixelRatio } = canvas;

  const commentsWithPosition = [...comments, pendingComment].filter(
    comment => comment?.position && comment.time == currentTime
  );
  console.log({ comments, commentsWithPosition });
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
          <VideoComment comment={comment} scale={scale} pixelRatio={gDevicePixelRatio} key={i} />
        ))}
      </div>
    </div>
  );
}

function VideoComment({ comment, scale, pixelRatio }) {
  const position = JSON.parse(comment.position);
  const [focused, setFocused] = useState(false);
  const { name, content } = comment;

  return (
    <div
      className="canvas-comment"
      style={{
        top: position.y * scale * pixelRatio,
        left: position.x * scale * pixelRatio,
      }}
    >
      <div className="canvas-comment-marker">
        <div className="img location-marker" onClick={() => setFocused(true)} />
      </div>
      {focused ? (
        <>
          <div className="mask" onClick={() => setFocused(false)} />
          <CommentContainer comment={comment} />
        </>
      ) : null}
    </div>
  );
}

function CommentContainer({ comment }) {
  return (
    <div className="canvas-comment-container">
      <div className="item-label">{comment.user.name}</div>
      <div className="item-content">{comment.content}</div>
    </div>
  );
}

export default connect(state => ({
  currentTime: selectors.getCurrentTime(state),
  pendingComment: selectors.getPendingComment(state),
  recordingId: selectors.getRecordingId(state),
  canvas: selectors.getCanvas(state),
}))(CommentsOverlay);
