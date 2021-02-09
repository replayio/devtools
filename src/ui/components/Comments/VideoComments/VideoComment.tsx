import React, { useState } from "react";
import { selectors } from "ui/reducers";
import classnames from "classnames";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { connect, ConnectedProps } from "react-redux";

function CommentContainer({ comment }: { comment: any }) {
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

function VideoComment({
  comment,
  canvas,
  activeComment,
  setHoveredComment,
  setActiveComment,
  hoveredComment,
}: PropsFromRedux) {
  if (!canvas) {
    return null;
  }

  const { scale } = canvas;
  const position = comment.position;

  return (
    <div
      className={`canvas-comment`}
      style={{
        top: position.y * scale,
        left: position.x * scale,
      }}
    >
      <div
        className={classnames("canvas-comment-marker", {
          highlighted: hoveredComment == comment.id,
          selected: comment == activeComment,
        })}
        onMouseEnter={() => setHoveredComment(comment.id)}
        onMouseLeave={() => setHoveredComment(null)}
        onClick={() => setActiveComment(comment)}
      >
        <div className="img comment-marker" />
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    pendingComment: selectors.getPendingComment(state),
    recordingId: selectors.getRecordingId(state),
    canvas: selectors.getCanvas(state),
    hoveredComment: selectors.getHoveredComment(state),
    activeComment: selectors.getActiveComment(state),
  }),
  { setHoveredComment: actions.setHoveredComment, setActiveComment: actions.setActiveComment }
);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  comment: any;
};
export default connector(VideoComment);
