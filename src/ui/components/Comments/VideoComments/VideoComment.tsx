import { ChatAltIcon } from "@heroicons/react/solid";
import classnames from "classnames";

import { getCanvas } from "ui/actions/app";
import { useAppSelector } from "ui/setup/hooks";
import { Comment } from "ui/state/comments";

const MARKER_DIAMETER = 28;
const MARKER_RADIUS = 14;

export default function VideoComment({ comment }: { comment: Comment }) {
  const canvas = useAppSelector(getCanvas);

  if (!canvas || !comment) {
    return null;
  }

  const { scale } = canvas;
  const position = comment.position;

  if (!position) {
    return null;
  }

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
        <span
          className={classnames(
            "relative inline-flex cursor-pointer rounded-full bg-secondaryAccent transition duration-300 ease-in-out"
          )}
          style={{ width: `${MARKER_DIAMETER}px`, height: `${MARKER_DIAMETER}px` }}
        />
        <ChatAltIcon className="pointer-events-none absolute h-3.5 w-3.5 text-white	" />
      </div>
    </div>
  );
}
