import { connect, ConnectedProps } from "react-redux";
import React, { useState, useEffect } from "react";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
import "./CommentTool.css";
import { Comment, Reply } from "ui/state/comments";
import { ChatIcon } from "@heroicons/react/solid";

const mouseEventCanvasPosition = (e: MouseEvent) => {
  const canvas = document.getElementById("graphics");
  const bounds = canvas!.getBoundingClientRect();

  const scale = bounds.width / canvas!.offsetWidth;

  return {
    x: (e.clientX - bounds.left) / scale,
    y: (e.clientY - bounds.top) / scale,
  };
};

type CommentToolProps = PropsFromRedux & {
  comments: (Comment | Reply)[];
};

type Coordinates = {
  x: number;
  y: number;
};

function CommentTool({
  pendingComment,
  currentTime,
  executionPoint,
  comments,
  canvas,
  setPendingComment,
  createComment,
}: CommentToolProps) {
  const [showHelper, setShowHelper] = useState(false);
  const [mousePosition, setMousePosition] = useState<Coordinates | null>(null);
  const isInvalidNewComment = comments.find(
    comment => comment.point == executionPoint && comment.time == currentTime
  );

  const addListeners = () => {
    const videoNode = document.getElementById("graphics");

    if (videoNode) {
      videoNode.classList.add("location-marker");
      videoNode.addEventListener("mouseup", onClickInCanvas);
      videoNode.addEventListener("mouseenter", onMouseEnter);
      videoNode.addEventListener("mousemove", onMouseMove);
      videoNode.addEventListener("mouseleave", onMouseLeave);
    }
  };
  const removeListeners = () => {
    const videoNode = document.getElementById("graphics");

    if (videoNode) {
      videoNode.classList.remove("location-marker");
      videoNode.removeEventListener("mouseup", onClickInCanvas);
      videoNode.removeEventListener("mouseenter", onMouseEnter);
      videoNode.removeEventListener("mousemove", onMouseMove);
      videoNode.removeEventListener("mouseleave", onMouseLeave);
    }
  };
  const onClickInCanvas = async (e: MouseEvent) => {
    if (e.target !== document.querySelector("canvas#graphics")) {
      return;
    }

    // If there's no pending comment at that point and time, create one
    // with the mouse click as its position.
    if (!pendingComment) {
      const isInvalidNewComment = comments.find(
        comment => comment.point == executionPoint && comment.time == currentTime
      );

      if (isInvalidNewComment) {
        return;
      }

      createComment(currentTime, executionPoint, mouseEventCanvasPosition(e));
      return;
    }

    // If there's a pending comment (not a reply), change its position.
    if (pendingComment.type == "new_comment" || pendingComment.type == "edit_comment") {
      const newComment = { ...pendingComment };
      newComment.comment.position = mouseEventCanvasPosition(e);

      setPendingComment(newComment);
    }
  };
  const onMouseEnter = () => {
    setShowHelper(true);
  };
  const onMouseMove = (e: MouseEvent) => setMousePosition(mouseEventCanvasPosition(e));
  const onMouseLeave = () => {
    setShowHelper(false);
    setMousePosition(null);
  };

  // Re-register the listener on every update to prevent the props used by
  // the handler functions from being stale.
  useEffect(() => {
    addListeners();
    return () => removeListeners();
  }, [currentTime, executionPoint, pendingComment, comments]);

  if (!showHelper || !mousePosition || pendingComment || isInvalidNewComment) {
    return null;
  }

  const { x, y } = mousePosition;

  return (
    <div
      className="px-4 py-2 absolute bg-blue-500 text-white ml-2 mt-2 rounded-xl w-max space-x-2 flex items-center"
      style={{ top: y * canvas!.scale, left: x * canvas!.scale }}
    >
      <ChatIcon className="h-6 w-6" aria-hidden="true" />
      <span>Add Comment</span>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingTarget: selectors.getRecordingTarget(state),
    pendingComment: selectors.getPendingComment(state),
    executionPoint: getExecutionPoint(state),
    currentTime: selectors.getCurrentTime(state),
    canvas: selectors.getCanvas(state),
  }),
  {
    setPendingComment: actions.setPendingComment,
    createComment: actions.createComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentTool);
