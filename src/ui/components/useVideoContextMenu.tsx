import { MouseEvent, RefObject, UIEvent, useContext, useRef } from "react";
import { ContextMenuItem, assertMouseEvent, useContextMenu } from "use-context-menu";

import {
  highlightNode,
  selectNode,
  unhighlightNode,
} from "devtools/client/inspector/markup/actions/markup";
import { assert } from "protocol/utils";
import { createTypeDataForVisualComment } from "replay-next/components/sources/utils/comments";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { fetchMouseTargetsForPause } from "ui/actions/app";
import { createFrameComment } from "ui/actions/comments";
import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { useAppDispatch } from "ui/setup/hooks";
import { getMouseTarget } from "ui/suspense/nodeCaches";
import { mouseEventCanvasPosition as getPositionForInspectingElement } from "ui/utils/nodePicker";

export default function useVideoContextMenu({
  canvasRef,
}: {
  canvasRef: RefObject<HTMLCanvasElement>;
}) {
  const { showCommentsPanel } = useContext(InspectorContext);
  const { accessToken, recordingId } = useContext(SessionContext);

  const dispatch = useAppDispatch();

  const mouseEventDataRef = useRef<{
    pageX: number | null;
    pageY: number | null;
    position: { x: number; y: number } | null;
    targetNodeId: string | null;
  }>({
    pageX: null,
    pageY: null,
    position: null,
    targetNodeId: null,
  });

  const addComment = async () => {
    const { pageX, pageY, position } = mouseEventDataRef.current;

    const canvas = document.querySelector("canvas#graphics");

    const typeData = await createTypeDataForVisualComment(
      canvas as HTMLCanvasElement,
      pageX,
      pageY
    );

    dispatch(createFrameComment(position, recordingId, typeData));

    if (showCommentsPanel) {
      showCommentsPanel();
    }
  };

  const [, dismissInspectElementNag] = useNag(Nag.INSPECT_ELEMENT); // Replay Passport
  const inspectElement = () => {
    dismissInspectElementNag();
    const nodeId = mouseEventDataRef.current.targetNodeId;
    if (nodeId !== null) {
      dispatch(setViewMode("dev"));
      dispatch(setSelectedPanel("inspector"));
      dispatch(selectNode(nodeId));
    }
  };

  const onHide = () => {
    mouseEventDataRef.current.pageX = null;
    mouseEventDataRef.current.pageY = null;
    mouseEventDataRef.current.position = null;
    mouseEventDataRef.current.targetNodeId = null;

    dispatch(unhighlightNode());
  };

  const onShow = async (event: UIEvent) => {
    if (assertMouseEvent(event)) {
      const canvas = canvasRef.current;
      assert(canvas !== null);

      // Data needed for adding a comment:
      mouseEventDataRef.current.pageX = event.pageX;
      mouseEventDataRef.current.pageY = event.pageY;
      mouseEventDataRef.current.position = getPositionForAddingComment(event);

      // Data needed for inspecting an element:

      const position = getPositionForInspectingElement(event.nativeEvent, canvas);
      if (position != null) {
        const { x, y } = position;

        const boundingRects = await dispatch(fetchMouseTargetsForPause());
        const target = getMouseTarget(boundingRects ?? [], x, y);
        const targetNodeId = target?.node ?? null;
        mouseEventDataRef.current.targetNodeId = targetNodeId;
        if (targetNodeId !== null) {
          dispatch(highlightNode(targetNodeId));
        }
      }
    }
  };

  return useContextMenu(
    <>
      <ContextMenuItem onSelect={inspectElement}>Inspect element</ContextMenuItem>
      {accessToken !== null && <ContextMenuItem onSelect={addComment}>Add comment</ContextMenuItem>}
    </>,
    {
      onHide,
      onShow,
      requireClickToShow: true,
    }
  );
}

function getPositionForAddingComment(event: MouseEvent): { x: number; y: number } {
  const canvas = document.getElementById("graphics");
  const bounds = canvas!.getBoundingClientRect();

  const scale = bounds.width / canvas!.offsetWidth;

  return {
    x: (event.clientX - bounds.left) / scale,
    y: (event.clientY - bounds.top) / scale,
  };
}
