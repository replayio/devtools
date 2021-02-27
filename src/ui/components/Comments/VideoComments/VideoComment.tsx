import React, { useState } from "react";
import { selectors } from "ui/reducers";
import classnames from "classnames";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { connect, ConnectedProps } from "react-redux";
import { Canvas } from "ui/state/app";
import { Comment } from "ui/state/comments";

function inCenter(canvas: Canvas, { position }: Comment) {
  return position.x / canvas.width == 0.5 && position.y / canvas.height;
}

function VideoComment({
  comment,
  canvas,
  activeComment,
  setHoveredComment,
  setActiveComment,
  hoveredComment,
  currentTime,
  hoverTime,
}: PropsFromRedux) {
  if (!canvas || !comment) {
    return null;
  }

  const { scale } = canvas;
  const position = comment.position;

  // Hide pins while the user is hovering in the timeline
  if (!hoveredComment && hoverTime && hoverTime != currentTime) {
    return null;
  }

  // Hide pins that were never moved
  if (comment.content != "" && inCenter(canvas, comment)) {
    return null;
  }

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
    hoverTime: selectors.getHoverTime(state),
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
