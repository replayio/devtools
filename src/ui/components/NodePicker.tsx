import { NodeBounds } from "@replayio/protocol";
import classnames from "classnames";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";

import {
  highlightNode,
  selectNode,
  unhighlightNode,
} from "devtools/client/inspector/markup/actions/markup";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import {
  fetchMouseTargetsForPause,
  loadMouseTargets,
  nodePickerDisabled,
  nodePickerInitializing,
  nodePickerReady,
  setMouseTargetsLoading,
} from "ui/actions/app";
import { setSelectedPanel } from "ui/actions/layout";
import { useAppDispatch } from "ui/setup/hooks";
import { getMouseTarget } from "ui/suspense/nodeCaches";
import { NodePicker as NodePickerClass } from "ui/utils/nodePicker";

interface Position {
  x: number;
  y: number;
}

interface GlobalNodePickerTestMethods {
  clickNodePickerButton: () => Promise<void>;
  nodePickerMouseClickInCanvas: (pos: Position | null) => Promise<void>;
}

const nodePickerInstance = new NodePickerClass();

export function NodePicker() {
  const dispatch = useAppDispatch();
  const [, dismissInspectElementNag] = useNag(Nag.INSPECT_ELEMENT); // Replay Passport

  // Contrast with the React DevTools instance of the picker
  const [globalNodePickerActive, setGlobalNodePickerActive] = useState(false);

  const nodePickerRemoveTime = useRef<number | undefined>(undefined);

  async function clickNodePickerButton(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (globalNodePickerActive) {
      // The node picker mousedown listener will take care of deactivation.
      return;
    }

    // Hacky workaround to make sure the picker stays deactivated when
    // clicking on its icon.
    const now = Date.now();
    if (nodePickerRemoveTime.current && now - nodePickerRemoveTime.current < 200) {
      return;
    }

    setGlobalNodePickerActive(true);
    dispatch(nodePickerInitializing("domElement"));
    await dispatch(loadMouseTargets());
    dispatch(nodePickerReady("domElement"));
    dispatch(setSelectedPanel("inspector"));
    dismissInspectElementNag(); // Replay Passport
  }

  const handleNodeSelected = useCallback(
    async function handleNodeSelected(nodeId: string) {
      dispatch(highlightNode(nodeId));
      dispatch(selectNode(nodeId));
    },
    [dispatch]
  );

  const nodePickerMouseClickInCanvas = useCallback(
    async function nodePickerMouseClickInCanvas(pos: Position | null) {
      setGlobalNodePickerActive(false);
      nodePickerRemoveTime.current = Date.now();
      let nodeBounds: NodeBounds | null = null;
      if (pos) {
        const boundingRects = await dispatch(fetchMouseTargetsForPause());
        nodeBounds = getMouseTarget(boundingRects ?? [], pos.x, pos.y);
      }
      if (nodeBounds) {
        handleNodeSelected(nodeBounds.node);
      } else {
        dispatch(unhighlightNode());
      }
    },
    [dispatch, handleNodeSelected]
  );

  useLayoutEffect(() => {
    if (globalNodePickerActive) {
      function disableNodePicker() {
        nodePickerInstance.disable();
        setGlobalNodePickerActive(false);
        dispatch(nodePickerDisabled());
        dispatch(setMouseTargetsLoading(false));
      }

      nodePickerInstance.enable({
        name: "domElement",
        onHighlightNode(nodeId) {
          // No timer, but use actual box models to show the various sections in the highlight,
          // rather than just the contents from the bounding rect
          dispatch(highlightNode(nodeId, true));
        },
        onUnhighlightNode() {
          dispatch(unhighlightNode());
        },
        async onPicked(nodeId) {
          nodePickerRemoveTime.current = Date.now();

          if (nodeId) {
            handleNodeSelected(nodeId);
          } else {
            dispatch(unhighlightNode());
          }

          disableNodePicker();
        },
        onCheckNodeBounds: async (x, y, nodeIds) => {
          const boundingRects = await dispatch(fetchMouseTargetsForPause());
          return getMouseTarget(boundingRects ?? [], x, y, nodeIds);
        },
        onClickOutsideCanvas() {
          disableNodePicker();
        },
      });
    } else {
      nodePickerInstance.disable();
    }
  }, [globalNodePickerActive, dispatch, handleNodeSelected]);

  return (
    <button
      id="command-button-pick"
      className={classnames("devtools-button toolbar-panel-button tab", {
        active: globalNodePickerActive,
      })}
      onClick={clickNodePickerButton}
      title="Select an element in the video to inspect it"
    />
  );
}
