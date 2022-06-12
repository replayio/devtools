import { connect, ConnectedProps } from "react-redux";
import React, { useState, useEffect, useRef } from "react";
import { actions } from "ui/actions";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
const { getExecutionPoint } = require("devtools/client/debugger/src/reducers/pause");
import { Comment, Reply } from "ui/state/comments";
import classNames from "classnames";
import { Canvas } from "ui/state/app";
import { useGetRecordingId } from "ui/hooks/recordings";

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
  currentTime,
  executionPoint,
  comments,
  areMouseTargetsLoading,
  canvas,
  createFrameComment,
  setSelectedPrimaryPanel,
}: CommentToolProps) {
  const [mousePosition, setMousePosition] = useState<Coordinates | null>(null);
  const recordingId = useGetRecordingId();
  const captionNode = useRef<HTMLDivElement | null>(null);

  // Re-register the listener on every update to prevent the props used by the handler functions from being stale.
  useEffect(() => {
    const videoNode = document.getElementById("graphics");
    if (videoNode) {
      const onClickInCanvas = async (e: MouseEvent) => {
        if (e.target !== document.querySelector("canvas#graphics")) {
          return;
        }

        createFrameComment(currentTime, executionPoint, mouseEventCanvasPosition(e), recordingId);

        setSelectedPrimaryPanel("comments");
      };

      const onMouseMove = (e: MouseEvent) => setMousePosition(mouseEventCanvasPosition(e));
      const onMouseLeave = () => {
        setMousePosition(null);
      };

      videoNode.classList.add("location-marker");

      videoNode.addEventListener("mouseup", onClickInCanvas);
      videoNode.addEventListener("mousemove", onMouseMove);
      videoNode.addEventListener("mouseleave", onMouseLeave);

      return () => {
        videoNode.classList.remove("location-marker");

        videoNode.removeEventListener("mouseup", onClickInCanvas);
        videoNode.removeEventListener("mousemove", onMouseMove);
        videoNode.removeEventListener("mouseleave", onMouseLeave);
      };
    }
  }, [
    comments,
    createFrameComment,
    currentTime,
    executionPoint,
    recordingId,
    setSelectedPrimaryPanel,
  ]);

  if (!mousePosition) {
    return null;
  }

  const { parentStyle, childStyle } = getStyles(mousePosition, canvas!, captionNode.current);
  const label = areMouseTargetsLoading ? "Targets loading..." : "Add comment";

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
    executionPoint: getExecutionPoint(state),
    currentTime: selectors.getCurrentTime(state),
    canvas: selectors.getCanvas(state),
    areMouseTargetsLoading: selectors.areMouseTargetsLoading(state),
  }),
  {
    createFrameComment: actions.createFrameComment,
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CommentTool);
