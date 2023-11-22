import { BoxModel } from "@replayio/protocol";

import { getPauseId } from "devtools/client/debugger/src/selectors";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import type { UIThunkAction } from "ui/actions";
import { boundingRectsCache, boundingRectsToBoxModel, boxModelCache } from "ui/suspense/nodeCaches";
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
      dispatch(highlightNode(nodeId, false, 1000));
      dispatch(nodeSelected(nodeId));
    }
  };
}

let unhighlightTimer: ReturnType<typeof window.setTimeout> | null = null;

export function highlightNodes(
  nodeIds: string[],
  pauseId?: string,
  useRealBoxModels = false,
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

      let boxModels: BoxModel[] = [];

      if (useRealBoxModels) {
        // In some cases, we care about showing "real" box models when highlighting a node:
        // - hovering over the Box Model section of the "Layout" tab
        // - the DOM node picker
        // - relevant DOM nodes from Cypress test step details
        // In that case, fetch real box models so we can show each piece separately.
        // (The step details case should have pre-fetched those box models already.)
        boxModels = await Promise.all(
          nodeIds.map(async nodeId => {
            const boxModel = await boxModelCache.readAsync(replayClient, pauseId!, nodeId);
            return boxModel;
          })
        );
      } else {
        // But for other cases, we're really just trying to show the node's contents,
        // such as when hovering over a React component.
        // Fetching the bounding rects _might_ be a bit slower up front,
        // but once we have them fetched we can highlight any node in this pause immediately.
        const boundingClientRects = await boundingRectsCache.readAsync(replayClient, pauseId!);
        const boxModelsFromClientRects = nodeIds.map(nodeId => {
          return boundingRectsToBoxModel(nodeId, boundingClientRects);
        });
        boxModels = boxModelsFromClientRects;
      }

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

export function highlightNode(
  nodeId: string,
  useRealBoxModels?: boolean,
  duration?: number
): UIThunkAction {
  // Assume we're highlighting the current pause here
  return highlightNodes([nodeId], undefined, useRealBoxModels, duration);
}

export function unhighlightNode(): UIThunkAction {
  return async (dispatch, getState) => {
    const { highlightedNodes } = getState().markup;
    if (highlightedNodes && highlightedNodes.length > 0) {
      dispatch(nodeHighlightingCleared());
    }
  };
}
