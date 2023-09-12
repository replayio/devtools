import { ChatAltIcon } from "@heroicons/react/solid";
import classnames from "classnames";

import { getCanvas, setHoveredCommentId, setSelectedCommentId } from "ui/actions/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Comment } from "ui/state/comments";

const MARKER_DIAMETER = 28;
const MARKER_RADIUS = 14;

export default function VideoComment({
  comment,
  isHighlighted,
}: {
  comment: Comment;
  isHighlighted: boolean;
}) {
  const dispatch = useAppDispatch();

  const canvas = useAppSelector(getCanvas);
  if (!canvas || !comment) {
    return null;
  }

  const { scale } = canvas;

  const position = comment.position;
  if (!position) {
    return null;
  }

  const accentClassName = isHighlighted ? "bg-secondaryAccent" : "bg-primaryAccent";

  return (
    <div
      className={`canvas-comment`}
      onClick={() => {
        dispatch(setSelectedCommentId(comment.id));
      }}
      onMouseEnter={() => {
        dispatch(setHoveredCommentId(comment.id));
      }}
      onMouseLeave={() => {
        dispatch(setHoveredCommentId(null));
      }}
      style={{
        top: position.y * scale - MARKER_RADIUS,
        left: position.x * scale - MARKER_RADIUS,
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: `${MARKER_DIAMETER}px`, height: `${MARKER_DIAMETER}px` }}
      >
        <span
          className={classnames(
            accentClassName,
            "relative inline-flex cursor-pointer rounded-full transition duration-300 ease-in-out"
          )}
          style={{ width: `${MARKER_DIAMETER}px`, height: `${MARKER_DIAMETER}px` }}
        />
        <ChatAltIcon className="pointer-events-none absolute h-3.5 w-3.5 text-white	" />
      </div>
    </div>
  );
}
