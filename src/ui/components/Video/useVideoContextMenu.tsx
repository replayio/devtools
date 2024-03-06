import React, { MouseEvent, UIEvent, useContext, useEffect, useRef } from "react";
import { ContextMenuItem, assertMouseEvent, useContextMenu } from "use-context-menu";

import {
  highlightNode,
  selectNode,
  unhighlightNode,
} from "devtools/client/inspector/markup/actions/markup";
import Icon from "replay-next/components/Icon";
import { createTypeDataForVisualComment } from "replay-next/components/sources/utils/comments";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { useNag } from "replay-next/src/hooks/useNag";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Nag } from "shared/graphql/types";
import { createFrameComment } from "ui/actions/comments";
import { setSelectedPanel, setViewMode } from "ui/actions/layout";
import { stopPlayback } from "ui/actions/timeline";
import { getMouseEventPosition } from "ui/components/Video/imperative/getMouseEventPosition";
import { isPlaying as isPlayingSelector } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { boundingRectsCache, getMouseTarget } from "ui/suspense/nodeCaches";

import styles from "./Video.module.css";

export default function useVideoContextMenu() {
  const { showCommentsPanel } = useContext(InspectorContext);
  const replayClient = useContext(ReplayClientContext);
  const { accessToken, recordingId } = useContext(SessionContext);

  const { pauseId } = useMostRecentLoadedPause() ?? {};

  const dispatch = useAppDispatch();
  const isPlaying = useAppSelector(isPlayingSelector);

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

  const addComment = async ({
    pageX,
    pageY,
    position,
  }: {
    pageX: number | null;
    pageY: number | null;
    position: { x: number; y: number } | null;
  }) => {
    if (accessToken === null) {
      return;
    }

    const image = document.getElementById("graphics");
    const typeData = await createTypeDataForVisualComment(image, pageX, pageY);

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
    if (pauseId == null) {
      return;
    }

    if (isPlaying) {
      dispatch(stopPlayback());
    }

    if (assertMouseEvent(event)) {
      // Data needed for adding a comment:
      mouseEventDataRef.current.pageX = event.pageX;
      mouseEventDataRef.current.pageY = event.pageY;
      mouseEventDataRef.current.position = getPositionForAddingComment(event);

      // Data needed for inspecting an element:
      const position = getMouseEventPosition(event.nativeEvent);
      if (position != null) {
        const { x, y } = position;

        const boundingRects = await boundingRectsCache.readAsync(replayClient, pauseId);
        const target = getMouseTarget(boundingRects ?? [], x, y);
        const targetNodeId = target?.node ?? null;
        mouseEventDataRef.current.targetNodeId = targetNodeId;
        if (targetNodeId !== null) {
          dispatch(highlightNode(targetNodeId));
        }
      }
    }
  };

  const { contextMenu, hideMenu, onContextMenu } = useContextMenu(
    <>
      {accessToken !== null && (
        <ContextMenuItem
          dataTestName="ContextMenuItem-AddComment"
          onSelect={() => addComment(mouseEventDataRef.current)}
        >
          <>
            <Icon className={styles.ContextMenuIcon} type="comment" />
            Add comment
          </>
        </ContextMenuItem>
      )}
      <ContextMenuItem onSelect={inspectElement}>
        <>
          <Icon className={styles.ContextMenuIcon} type="inspect" />
          Inspect element
        </>
      </ContextMenuItem>
    </>,
    {
      dataTestName: "ContextMenu-Video",
      dataTestId: "ContextMenu-Video",
      onHide,
      onShow,
      requireClickToShow: true,
    }
  );

  useEffect(() => {
    if (contextMenu && isPlaying) {
      hideMenu();
    }
  }, [contextMenu, hideMenu, isPlaying]);

  return {
    addComment: (e: React.MouseEvent) =>
      addComment({
        pageX: e.pageX,
        pageY: e.pageY,
        position: getPositionForAddingComment(e),
      }),
    contextMenu,
    onContextMenu,
  };
}

function getPositionForAddingComment(event: MouseEvent): { x: number; y: number } {
  const element = event.currentTarget as HTMLElement;
  const bounds = element.getBoundingClientRect();

  const scale = bounds.width / element.offsetWidth;

  return {
    x: (event.clientX - bounds.left) / scale,
    y: (event.clientY - bounds.top) / scale,
  };
}
