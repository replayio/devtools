import classNames from "classnames";
import React, { useContext, useEffect, useRef, useState } from "react";

import {
  VisualCommentTypeData,
  createTypeDataForVisualComment,
} from "replay-next/components/sources/utils/comments";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { getAreMouseTargetsLoading, getCanvas } from "ui/actions/app";
import { createFrameComment } from "ui/actions/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Canvas } from "ui/state/app";
import { Comment, Reply } from "ui/state/comments";
import useAuth0 from "ui/utils/useAuth0";

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

type Coordinates = {
  x: number;
  y: number;
};

export default function CommentTool({ comments }: { comments: (Comment | Reply)[] }) {
  const canvas = useAppSelector(getCanvas);
  const areMouseTargetsLoading = useAppSelector(getAreMouseTargetsLoading);
  const { isAuthenticated } = useAuth0();
  const { showCommentsPanel } = useContext(InspectorContext);

  const dispatch = useAppDispatch();

  const [mousePosition, setMousePosition] = useState<Coordinates | null>(null);
  const recordingId = useGetRecordingId();
  const captionNode = useRef<HTMLDivElement | null>(null);

  // Re-register the listener on every update to prevent the props used by the handler functions from being stale.
  useEffect(() => {
    const videoNode = document.getElementById("graphics");
    if (videoNode) {
      const onClickInCanvas = async (event: MouseEvent) => {
        if (event.target !== document.querySelector("canvas#graphics")) {
          return;
        }

        // Un-authenticated users can't comment on Replays.
        if (isAuthenticated) {
          const position = mouseEventCanvasPosition(event);

          let typeData: VisualCommentTypeData | null = null;

          const canvas = document.querySelector("canvas#graphics");
          if (canvas) {
            typeData = await createTypeDataForVisualComment(
              canvas as HTMLCanvasElement,
              event.pageX,
              event.pageY
            );
          }

          dispatch(createFrameComment(position, recordingId, typeData));
        }

        showCommentsPanel?.();
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
  }, [comments, dispatch, isAuthenticated, recordingId, showCommentsPanel]);

  // Un-authenticated users can't comment on Replays.
  if (!isAuthenticated) {
    return null;
  }

  if (!mousePosition) {
    return null;
  }

  const { parentStyle, childStyle } = getStyles(mousePosition, canvas!, captionNode.current);
  const label = areMouseTargetsLoading ? "Targets loading..." : "Add comment";

  return (
    <div style={parentStyle} className="absolute">
      <div
        className={classNames(
          "absolute flex w-max items-center space-x-1.5 rounded-md bg-tooltipBgcolor bg-opacity-70 px-2.5 py-1 text-xs text-tooltipColor ",
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
