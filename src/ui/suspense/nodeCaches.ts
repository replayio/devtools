import { BoxModel, NodeBounds, PauseId, Node as ProtocolNode, Quads } from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { elementCache } from "replay-next/components/elements-old/suspense/ElementCache";
import { ReplayClientInterface } from "shared/client/types";

import { computedStyleCache } from "./styleCaches";

export const boundingRectsCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId],
  NodeBounds[]
> = createCache({
  config: { immutable: true },
  debugLabel: "BoundingRects",
  getKey: ([replayClient, pauseId]) => pauseId,
  load: async ([replayClient, pauseId]) => {
    const { elements } = await replayClient.getAllBoundingClientRects(pauseId);
    return elements;
  },
});

const TAGS_WITHOUT_BOX_MODELS = ["head", "link", "title", "meta", "script", "noscript", "style"];

const EMPTY_QUADS: Quads = [0, 0, 0, 0, 0, 0, 0, 0];
const NO_BOX_MODEL: BoxModel = {
  node: "",
  border: EMPTY_QUADS,
  content: EMPTY_QUADS,
  margin: EMPTY_QUADS,
  padding: EMPTY_QUADS,
};

export function isElement(node: ProtocolNode) {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function canHighlightNode(node: ProtocolNode) {
  return isElement(node) && !TAGS_WITHOUT_BOX_MODELS.includes(node.nodeName);
}

export const boxModelCache: Cache<
  [replayClient: ReplayClientInterface, pauseId: PauseId, nodeId: string],
  BoxModel
> = createCache({
  config: { immutable: true },
  debugLabel: "BoxModel",
  getKey: ([replayClient, pauseId, nodeId]) => `${pauseId}:${nodeId}`,
  load: async ([replayClient, pauseId, nodeId]) => {
    if (!pauseId || typeof nodeId !== "string") {
      return NO_BOX_MODEL;
    }

    const element = await elementCache.readAsync(replayClient, pauseId, nodeId);
    const nodeMayBeHighlightable = canHighlightNode(element.node);

    let nodeIsVisible = true;

    if (nodeMayBeHighlightable) {
      // Only do the computed style check once we know
      // if you can even highlight this node
      const computedStyle = await computedStyleCache.readAsync(replayClient, pauseId, nodeId);
      const displayValue = computedStyle?.get("display");
      nodeIsVisible = displayValue !== "none";
    }

    const canFetchBoxModel = nodeMayBeHighlightable && nodeIsVisible;

    if (!canFetchBoxModel) {
      // Return a fake entry with no size
      return {
        ...NO_BOX_MODEL,
        node: nodeId,
      };
    }

    const { model: nodeBoxModel } = await replayClient.getBoxModel(pauseId, nodeId);
    return nodeBoxModel;
  },
});

// For node highlighting perf purposes, we can synthesize `BoxModel` objects
// out of the `NodeBounds` objects we get from the protocol.
export function boundingRectsToBoxModel(
  nodeId: string,
  boundingClientRects: NodeBounds[]
): BoxModel {
  const nodeBounds = boundingClientRects.find(({ node }) => node === nodeId);
  if (!nodeBounds) {
    return {
      ...NO_BOX_MODEL,
      node: nodeId,
    };
  }

  const { rect, rects } = nodeBounds;
  const [left, top, right, bottom] = rects ? rects[0] : rect;

  const content = [left, top, right, top, right, bottom, left, bottom];

  return {
    node: nodeId,
    border: EMPTY_QUADS,
    content,
    margin: EMPTY_QUADS,
    padding: EMPTY_QUADS,
  };
}

export function getMouseTarget(
  mouseTargets: NodeBounds[],
  x: number,
  y: number,
  nodeIds?: Set<string>
) {
  for (let nodeBounds of mouseTargets) {
    let { node, rect, rects, clipBounds, visibility, pointerEvents } = nodeBounds;
    if (nodeIds && !nodeIds.has(node)) {
      continue;
    }
    if (visibility === "hidden" || pointerEvents === "none") {
      continue;
    }
    if (
      (clipBounds?.left !== undefined && x < clipBounds.left) ||
      (clipBounds?.right !== undefined && x > clipBounds.right) ||
      (clipBounds?.top !== undefined && y < clipBounds.top) ||
      (clipBounds?.bottom !== undefined && y > clipBounds.bottom)
    ) {
      continue;
    }

    // in the protocol, rects is set to undefined if there is only one rect
    rects ||= [rect];
    for (const r of rects) {
      const [left, top, right, bottom] = r;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return nodeBounds;
      }
    }
  }
  return null;
}
