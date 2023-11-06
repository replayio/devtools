import { getPauseId } from "devtools/client/debugger/src/selectors";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import type { UIThunkAction } from "ui/actions";
import { boxModelCache } from "ui/suspense/nodeCaches";
import { getCurrentPauseId } from "ui/utils/app";

import {
  nodeBoxModelsLoaded,
  nodeHighlightingCleared,
  nodeSelected,
  nodesHighlighted,
} from "../reducers/markup";

export function selectNode(nodeId: string): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const originalPauseId = await getCurrentPauseId(replayClient, getState());
    if (getPauseId(getState()) === originalPauseId) {
      dispatch(highlightNode(nodeId, 1000));
      dispatch(nodeSelected(nodeId));
    }
  };
}

let unhighlightTimer: ReturnType<typeof window.setTimeout> | null = null;

export function highlightNodes(
  nodeIds: string[],
  pauseId?: string,
  duration?: number
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const recordingCapabilities = await recordingCapabilitiesCache.readAsync(replayClient);
    if (!recordingCapabilities.supportsRepaintingGraphics) {
      return;
    }

    if (nodeIds.length === 0) {
      return;
    }

    if (!pauseId) {
      // We're trying to highlight nodes from the current pause.
      pauseId = await getCurrentPauseId(replayClient, getState());
    }

    const { highlightedNodes } = getState().markup;
    if (!highlightedNodes || !nodeIds.every(id => highlightedNodes.includes(id))) {
      dispatch(nodesHighlighted(nodeIds));

      const boxModels = await Promise.all(
        nodeIds.map(async nodeId => {
          const boxModel = await boxModelCache.readAsync(replayClient, pauseId!, nodeId);
          return boxModel;
        })
      );
      dispatch(nodeBoxModelsLoaded(boxModels));

      if (unhighlightTimer) {
        clearTimeout(unhighlightTimer);
      }

      if (duration) {
        unhighlightTimer = setTimeout(() => {
          dispatch(unhighlightNode());
        }, duration);
      }
    }
  };
}

export function highlightNode(nodeId: string, duration?: number): UIThunkAction {
  return highlightNodes([nodeId], undefined, duration);
}

export function unhighlightNode(): UIThunkAction {
  return async (dispatch, getState) => {
    const { highlightedNodes } = getState().markup;
    if (highlightedNodes && highlightedNodes.length > 0) {
      dispatch(nodeHighlightingCleared());
    }
  };
}
