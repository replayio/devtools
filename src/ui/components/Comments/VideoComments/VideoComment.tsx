import { ChatAltIcon } from "@heroicons/react/solid";
import classnames from "classnames";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";

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
        left: position.x * scale - MARKER_RADIUS,
        top: position.y * scale - MARKER_RADIUS,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ height: `${MARKER_DIAMETER}px`, width: `${MARKER_DIAMETER}px` }}
      >
        {isHighlighted ? (
          <span className="pointer-events-none absolute inline-flex h-full w-full animate-ping rounded-full bg-secondaryAccent opacity-75" />
        ) : null}
        <span
          className={classnames(
            "relative inline-flex cursor-pointer rounded-full bg-secondaryAccent transition duration-300 ease-in-out"
          )}
          onMouseEnter={() => setHoveredComment(comment.id)}
          onMouseLeave={() => setHoveredComment(null)}
          style={{ height: `${MARKER_DIAMETER}px`, width: `${MARKER_DIAMETER}px` }}
        />
        <ChatAltIcon className="pointer-events-none absolute h-3.5 w-3.5 text-white	" />
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    canvas: selectors.getCanvas(state),
    hoveredComment: selectors.getHoveredComment(state),
    pendingComment: selectors.getPendingComment(state),
  }),
  { setHoveredComment: actions.setHoveredComment }
);
type PropsFromRedux = ConnectedProps<typeof connector> & {
  comment: any;
};
export default connector(VideoComment);
