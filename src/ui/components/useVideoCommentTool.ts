import { MouseEvent, RefObject, useContext } from "react";

import {
  VisualCommentTypeData,
  createTypeDataForVisualComment,
} from "replay-next/components/sources/utils/comments";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import useTooltip from "replay-next/src/hooks/useTooltip";
import { getAreMouseTargetsLoading } from "ui/actions/app";
import { createFrameComment } from "ui/actions/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

export default function useVideoCommentTool(canvasRef: RefObject<HTMLCanvasElement>) {
  const { showCommentsPanel } = useContext(InspectorContext);

  const dispatch = useAppDispatch();

  const areMouseTargetsLoading = useAppSelector(getAreMouseTargetsLoading);
  const recordingId = useAppSelector(useGetRecordingId);

  const { isAuthenticated } = useAuth0();

  const onClick = async (event: MouseEvent) => {
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

  const { onMouseEnter, onMouseLeave, onMouseMove, tooltip } = useTooltip({
    containerRef: canvasRef,
    tooltip: areMouseTargetsLoading ? "Targets loading..." : "Add comment",
  });

  return { onClick, onMouseEnter, onMouseLeave, onMouseMove, tooltip };
}

function mouseEventCanvasPosition(event: MouseEvent): { x: number; y: number } {
  const canvas = document.getElementById("graphics");
  const bounds = canvas!.getBoundingClientRect();

  const scale = bounds.width / canvas!.offsetWidth;

  return {
    x: (event.clientX - bounds.left) / scale,
    y: (event.clientY - bounds.top) / scale,
  };
}
