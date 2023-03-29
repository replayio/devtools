import { NodeBounds } from "@replayio/protocol";
import classnames from "classnames";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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
  setIsNodePickerActive,
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

declare global {
  interface Window {
    // Used in the test harness for picking a node.
    // Assigned in a `useLayoutEffect` further below.
    gNodePicker: GlobalNodePickerTestMethods;
  }
}

interface GlobalNodePickerTestMethods {
  clickNodePickerButton: () => Promise<void>;
  nodePickerMouseClickInCanvas: (pos: Position | null) => Promise<void>;
}

const nodePickerInstance = new NodePickerClass();

export function NodePicker() {
  const dispatch = useAppDispatch();
  const [inspectElementState, dismissInspectElementNag] = useNag(Nag.INSPECT_ELEMENT); // Replay Assist

  // Contrast with the React DevTools instance of the picker
  const [globalNodePickerActive, setGlobalNodePickerActive] = useState(false);

  const nodePickerRemoveTime = useRef<number | undefined>(undefined);

  async function clickNodePickerButton() {
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
    dispatch(setIsNodePickerActive(true));
    dispatch(loadMouseTargets());
    dispatch(setSelectedPanel("inspector"));
    dismissInspectElementNag(); // Replay Assist
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
      nodePickerInstance.enable({
        onHighlightNode(nodeId) {
          dispatch(highlightNode(nodeId));
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

          setGlobalNodePickerActive(false);
          dispatch(setIsNodePickerActive(false));
          dispatch(setMouseTargetsLoading(false));
        },
        onCheckNodeBounds: async (x, y, nodeIds) => {
          const boundingRects = await dispatch(fetchMouseTargetsForPause());
          return getMouseTarget(boundingRects ?? [], x, y, nodeIds);
        },
      });
    } else {
      nodePickerInstance.disable();
    }
  }, [globalNodePickerActive, dispatch, handleNodeSelected]);

  useLayoutEffect(() => {
    // TODO Get rid of these globals and do DOM node checks in the test harness
    // Save these globally so that the test harness can use them
    window.gNodePicker = {
      clickNodePickerButton,
      nodePickerMouseClickInCanvas,
    };
  });

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
