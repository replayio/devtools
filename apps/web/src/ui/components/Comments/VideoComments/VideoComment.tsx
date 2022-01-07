import React from "react";
import { selectors } from "ui/reducers";
import classnames from "classnames";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { connect, ConnectedProps } from "react-redux";
import { ChatAltIcon } from "@heroicons/react/solid";

const MARKER_DIAMETER = 28;
const MARKER_RADIUS = 14;

function VideoComment({
  comment,
  canvas,
  setHoveredComment,
  hoveredComment,
  pendingComment,
}: PropsFromRedux) {
  if (!canvas || !comment) {
    return null;
  }

  const { scale } = canvas;
  const position = comment.position;

  const isHighlighted = hoveredComment === comment.id || pendingComment?.comment === comment;

  return (
    <div
      className={`canvas-comment`}
      style={{
        top: position.y * scale - MARKER_RADIUS,
        left: position.x * scale - MARKER_RADIUS,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: `${MARKER_DIAMETER}px`, height: `${MARKER_DIAMETER}px` }}
      >
        {isHighlighted ? (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondaryAccent opacity-75 pointer-events-none" />
        ) : null}
        <span
          className={classnames(
            "rounded-full relative inline-flex transition duration-300 ease-in-out bg-secondaryAccent cursor-pointer"
          )}
          onMouseEnter={() => setHoveredComment(comment.id)}
          onMouseLeave={() => setHoveredComment(null)}
          style={{ width: `${MARKER_DIAMETER}px`, height: `${MARKER_DIAMETER}px` }}
        />
        <ChatAltIcon className="w-3.5 h-3.5 absolute text-white pointer-events-none	" />
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    pendingComment: selectors.getPendingComment(state),
    canvas: selectors.getCanvas(state),
    hoveredComment: selectors.getHoveredComment(state),
  }),
  { setHoveredComment: actions.setHoveredComment }
);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  comment: any;
};
export default connector(VideoComment);
