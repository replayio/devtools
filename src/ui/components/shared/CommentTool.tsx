import { connect, ConnectedProps } from "react-redux";
import React, { useState, useEffect, useRef } from "react";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
import "./CommentTool.css";
import { Comment, Reply } from "ui/state/comments";
import classNames from "classnames";
import { Canvas } from "ui/state/app";
import { useGetRecordingId } from "ui/hooks/recordings";
import useAuth0 from "ui/utils/useAuth0";
import { useGetUserId } from "ui/hooks/users";
import { getCommentEditorDOMId } from "ui/components/Comments/TranscriptComments/CommentEditor/CommentEditor";

const mouseEventCanvasPosition = (e: MouseEvent) => {
  const canvas = document.getElementById("graphics");
  const bounds = canvas!.getBoundingClientRect();

  const scale = bounds.width / canvas!.offsetWidth;

  return {
    x: (e.clientX - bounds.left) / scale,
    y: (e.clientY - bounds.top) / scale,
  };
};

const getStyles = (
  mousePosition: Coordinates,
  canvas: Canvas,
  captionNode: HTMLDivElement | null
) => {
  const margin = 6;
  const { x, y } = mousePosition;
  const mouseTop = y * canvas.scale;
  const mouseLeft = x * canvas.scale;

  const parentStyle = { left: mouseLeft, top: mouseTop };
  const childStyle = { marginTop: margin, marginLeft: margin, transitionDuration: "100ms" };

  // On the first render of CommentTool, the node ref won't be available yet.
  if (!captionNode) {
    return { parentStyle, childStyle };
  }

  const canvasNode = document.getElementById("graphics");
  const bounds = canvasNode!.getBoundingClientRect();
  const { width, height } = captionNode.getBoundingClientRect();

  if (bounds.left + mouseLeft + width + margin > bounds.right) {
    childStyle.marginLeft = -(width + margin);
  }

  if (bounds.top + mouseTop + height + margin > bounds.bottom) {
    childStyle.marginTop = -(height + margin);
  }

  return { parentStyle, childStyle };
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
  createFrameComment,
}: CommentToolProps) {
  const [mousePosition, setMousePosition] = useState<Coordinates | null>(null);
  const recordingId = useGetRecordingId();
  const { user } = useAuth0();
  const { userId } = useGetUserId();
  const captionNode = useRef<HTMLDivElement | null>(null);

  const addListeners = () => {
    const videoNode = document.getElementById("graphics");

    if (videoNode) {
      videoNode.classList.add("location-marker");
      videoNode.addEventListener("mousedown", onMouseDown);
      videoNode.addEventListener("mouseup", onClickInCanvas);
      videoNode.addEventListener("mousemove", onMouseMove);
      videoNode.addEventListener("mouseleave", onMouseLeave);
    }
  };
  const removeListeners = () => {
    const videoNode = document.getElementById("graphics");

    if (videoNode) {
      videoNode.classList.remove("location-marker");
      videoNode.removeEventListener("mousedown", onMouseDown);
      videoNode.removeEventListener("mouseup", onClickInCanvas);
      videoNode.removeEventListener("mousemove", onMouseMove);
      videoNode.removeEventListener("mouseleave", onMouseLeave);
    }
  };
  const onMouseDown = (evt: MouseEvent) => {
    if (!pendingComment || !document.activeElement) {
      return;
    }

    const pendingCommentEditorId = getCommentEditorDOMId(pendingComment.comment);
    // this uses `[id="..."]` because comment ids can have "="s in them!
    const isEditorFocused = !!document.activeElement.closest(`[id="${pendingCommentEditorId}"]`);

    // If the pending comment's editor is focused, comment tool clicks should not take focus from it.
    if (isEditorFocused) {
      evt.preventDefault();
    }
  };
  const onClickInCanvas = async (e: MouseEvent) => {
    if (e.target !== document.querySelector("canvas#graphics")) {
      return;
    }

    // If there's no pending comment at that point and time, create one
    // with the mouse click as its position.
    if (!pendingComment) {
      createFrameComment(
        currentTime,
        executionPoint,
        mouseEventCanvasPosition(e),
        { ...user, id: userId },
        recordingId
      );
      return;
    }

    // If there's a pending comment (not a reply), change its position.
    if (pendingComment.type == "new_comment" || pendingComment.type == "edit_comment") {
      const newComment = { ...pendingComment };
      newComment.comment.position = mouseEventCanvasPosition(e);

      setPendingComment(newComment);
    }
  };
  const onMouseMove = (e: MouseEvent) => setMousePosition(mouseEventCanvasPosition(e));
  const onMouseLeave = () => {
    setMousePosition(null);
  };

  // Re-register the listener on every update to prevent the props used by
  // the handler functions from being stale.
  useEffect(() => {
    addListeners();
    return () => removeListeners();
  }, [currentTime, executionPoint, pendingComment, comments]);

  if (
    !mousePosition ||
    pendingComment?.type === "edit_reply" ||
    pendingComment?.type === "new_reply"
  ) {
    return null;
  }

  const { parentStyle, childStyle } = getStyles(mousePosition, canvas!, captionNode.current);

  return (
    <div style={parentStyle} className="absolute">
      <div
        className={classNames(
          "px-2.5 py-1 absolute text-xs text-white rounded-2xl w-max space-x-1.5 flex items-center bg-black bg-opacity-70",
          !captionNode.current ? "invisible" : ""
        )}
        style={childStyle}
        ref={captionNode}
      >
        {pendingComment?.type === "new_comment" || pendingComment?.type === "edit_comment" ? (
          <span>{"Move the marker"}</span>
        ) : (
          "Add comment"
        )}
      </div>
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
    createFrameComment: actions.createFrameComment,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentTool);
