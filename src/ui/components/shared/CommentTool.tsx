import { connect, ConnectedProps } from "react-redux";
import React, { useState, useEffect, useRef, RefObject } from "react";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
import { Comment } from "ui/state/comments";
import classNames from "classnames";
import { Canvas } from "ui/state/app";
import { useGetRecordingId } from "ui/hooks/recordings";
import useAuth0 from "ui/utils/useAuth0";
import { useGetUserId } from "ui/hooks/users";
// import { getCommentEditorDOMId } from "ui/components/Comments/TranscriptComments/CommentEditor/CommentEditor";

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
  comments: Comment[];
  canvasRef: RefObject<HTMLCanvasElement>;
};

type Coordinates = {
  x: number;
  y: number;
};

function CommentTool({
  pendingCommentData,
  currentTime,
  executionPoint,
  comments,
  areMouseTargetsLoading,
  canvas,
  createFrameComment,
  setPendingCommentData,
  setSelectedPrimaryPanel,
  canvasRef,
}: CommentToolProps) {
  const [mousePosition, setMousePosition] = useState<Coordinates | null>(null);
  const recordingId = useGetRecordingId();
  const { user } = useAuth0();
  const { userId } = useGetUserId();
  const captionNode = useRef<HTMLDivElement | null>(null);

  const addListeners = () => {
    if (!canvasRef.current) {
      return;
    }

    canvasRef.current.classList.add("location-marker");
    canvasRef.current.addEventListener("mousedown", onMouseDown);
    canvasRef.current.addEventListener("mouseup", onClickInCanvas);
    canvasRef.current.addEventListener("mousemove", onMouseMove);
    canvasRef.current.addEventListener("mouseleave", onMouseLeave);
  };
  const removeListeners = () => {
    if (!canvasRef.current) {
      return;
    }

    canvasRef.current.classList.remove("location-marker");
    canvasRef.current.removeEventListener("mousedown", onMouseDown);
    canvasRef.current.removeEventListener("mouseup", onClickInCanvas);
    canvasRef.current.removeEventListener("mousemove", onMouseMove);
    canvasRef.current.removeEventListener("mouseleave", onMouseLeave);
  };
  const onMouseDown = (evt: MouseEvent) => {
    //   if (!pendingComment || !document.activeElement) {
    //     return;
    //   }
    //   const pendingCommentEditorId = getCommentEditorDOMId(pendingComment.comment);
    //   // this uses `[id="..."]` because comment ids can have "="s in them!
    //   const isEditorFocused = !!document.activeElement.closest(`[id="${pendingCommentEditorId}"]`);
    //   // If the pending comment's editor is focused, comment tool clicks should not take focus from it.
    //   if (isEditorFocused) {
    //     evt.preventDefault();
    //   }
  };
  const onClickInCanvas = async (e: MouseEvent) => {
    if (e.target !== canvasRef.current) {
      return;
    }
    //   // If there's no pending comment at that point and time, create one
    //   // with the mouse click as its position.
    //   if (!pendingComment) {
    //     createFrameComment({
    //       time: currentTime,
    //       point: executionPoint,
    //       position: mouseEventCanvasPosition(e),
    //     });
    //     return;
    //   }
    //   // If there's a pending comment (not a reply), change its position.
    //   if (pendingComment.type == "new_comment" || pendingComment.type == "edit_comment") {
    //     const newComment = { ...pendingComment };
    //     newComment.comment.position = mouseEventCanvasPosition(e);
    //     // setPendingCommentData(null, {
    //     // TODO
    //     // })
    //     setPendingComment(newComment);
    //     setSelectedPrimaryPanel("comments");
    //   }
    // TODO
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
  }, [currentTime, executionPoint, /* pendingComment, */ comments]);

  if (
    !mousePosition
    //   || pendingComment?.type === "edit_reply" ||
    //   pendingComment?.type === "new_reply"
  ) {
    return null;
  }

  const { parentStyle, childStyle } = getStyles(mousePosition, canvas!, captionNode.current);
  let label = "Add comment";
  // if (areMouseTargetsLoading) {
  //   label = "Targets loading...";
  // } else if (pendingComment?.type === "new_comment" || pendingComment?.type === "edit_comment") {
  //   label = "Move the marker";
  // }

  return (
    <div style={parentStyle} className="absolute">
      <div
        className={classNames(
          "absolute flex w-max items-center space-x-1.5 rounded-2xl bg-black bg-opacity-70 px-2.5 py-1 text-xs text-white",
          !captionNode.current ? "invisible" : ""
        )}
        style={childStyle}
        ref={captionNode}
      >
        <span>{label}</span>
      </div>
    </div>
  );
}

const connector = connect(
  (state: UIState) => ({
    recordingTarget: selectors.getRecordingTarget(state),
    pendingCommentData: selectors.getPendingComment(state),
    executionPoint: getExecutionPoint(state),
    currentTime: selectors.getCurrentTime(state),
    canvas: selectors.getCanvas(state),
    areMouseTargetsLoading: selectors.areMouseTargetsLoading(state),
  }),
  {
    setPendingCommentData: actions.setPendingCommentData,
    createFrameComment: actions.createFrameComment,
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentTool);
