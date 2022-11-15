import { ObjectId, Rect } from "@replayio/protocol";

import { DisallowEverythingProxyHandler } from "../utils";

// Used by the highlighter when showing the bounding client rect of a node
// that might not be loaded yet, for the node picker.
export class NodeBoundsFront {
  private _rects: Rect[];
  nodeId: ObjectId;
  then = undefined;

  constructor(nodeId: ObjectId, rects: Rect[]) {
    this._rects = rects;

    this.nodeId = nodeId;
  }

  isNodeBoundsFront() {
    return true;
  }

  getBoxQuads(box: any) {
    return buildBoxQuadsFromRects(this._rects);
  }
}

Object.setPrototypeOf(NodeBoundsFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

function buildBoxQuadsFromRects(rects: Rect[]) {
  return rects.map(rect => {
    const [left, top, right, bottom] = rect;
    return DOMQuad.fromQuad({
      p1: { x: left, y: top },
      p2: { x: right, y: top },
      p3: { x: right, y: bottom },
      p4: { x: left, y: bottom },
    });
  });
}
