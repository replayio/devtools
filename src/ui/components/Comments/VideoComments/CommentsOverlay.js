import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";
import hooks from "ui/hooks";
import "./CommentsOverlay.css";

function CommentsOverlay({ pendingComment, canvas, recordingId, currentTime }) {
  const { comments } = hooks.useGetComments(recordingId);
  console.log({ canvas, comments, pendingComment });

  if (!canvas) {
    return null;
  }

  const { top, left, width, height, scale, gDevicePixelRatio } = canvas;
  const commentsWithPosition = [...comments, pendingComment].filter(
    comment => comment?.position && comment.time == currentTime
  );

  console.log({ commentsWithPosition });

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

  const onMarkerClick = e => {
    e.stopPropagation();
    setFocused(true);
  };
  const onMaskClick = e => {
    e.stopPropagation();
    setFocused(false);
  };

  return (
    <div
      className="canvas-comment"
      style={{
        top: position.y * scale * pixelRatio,
        left: position.x * scale * pixelRatio,
      }}
    >
      <div className="canvas-comment-marker">
        <div className="img location-marker" onClick={onMarkerClick} />
      </div>
      {focused ? (
        <>
          <div className="mask" onClick={onMaskClick} />
          <CommentContainer comment={comment} />
        </>
      ) : null}
    </div>
  );
}

function CommentContainer({ comment }) {
  return (
    <div className="canvas-comment-container">
      <img src={comment.user.picture} className="comment-picture" />
      <div className="comment-body">
        <div className="item-label">{comment.user.name}</div>
        <div className="item-content">{comment.content}</div>
      </div>
    </div>
  );
}

export default connect(state => ({
  currentTime: selectors.getCurrentTime(state),
  pendingComment: selectors.getPendingComment(state),
  recordingId: selectors.getRecordingId(state),
  canvas: selectors.getCanvas(state),
}))(CommentsOverlay);
