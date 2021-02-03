import React, { useState } from "react";
import { selectors } from "ui/reducers";
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
  setHoveredComment,
  activeComment,
  hoveredComment,
}: PropsFromRedux) {
  if (!canvas) {
    return null;
  }

  const { scale } = canvas;
  const position =
    typeof comment.position == "string" ? JSON.parse(comment.position) : comment.position;

  console.log({ comment, position });
  const [focused, setFocused] = useState(false);

  const onMarkerClick = () => {
    setFocused(true);
  };
  const onMaskClick = () => {
    setFocused(false);
  };

  return (
    <div
      className={`canvas-comment`}
      style={{
        top: position.y * scale,
        left: position.x * scale,
      }}
    >
      <div
        className={`canvas-comment-marker ${activeComment?.id == comment.id ? "active" : ""} ${
          hoveredComment?.id == comment.id ? "highlighted" : ""
        }`}
        onMouseEnter={() => setHoveredComment(comment.id)}
        onMouseLeave={() => setHoveredComment(null)}
        onClick={onMarkerClick}
      >
        <div className="img location-marker" />
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

const connector = connect(
  (state: UIState) => ({
    currentTime: selectors.getCurrentTime(state),
    pendingComment: selectors.getPendingComment(state),
    recordingId: selectors.getRecordingId(state),
    canvas: selectors.getCanvas(state),
    activeComment: selectors.getActiveComment(state),
    hoveredComment: selectors.getHoveredComment(state),
  }),
  { setHoveredComment: actions.setHoveredComment }
);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  comment: any;
  shouldParsePosition: boolean;
};
export default connector(VideoComment);
