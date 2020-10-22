import { ObjectId, Rect } from "record-replay-protocol";
import { DisallowEverythingProxyHandler } from "../utils";
import { Pause } from "./pause";

// Used by the highlighter when showing the bounding client rect of a node
// that might not be loaded yet, for the node picker.
export class NodeBoundsFront {
  private _pause: Pause;
  private _rect: Rect;
  nodeId: ObjectId;
  then = undefined;

  constructor(pause: Pause, nodeId: ObjectId, rect: Rect) {
    this._pause = pause;
    this._rect = rect;

    this.nodeId = nodeId;
  }

  isNodeBoundsFront() {
    return true;
  }

  getBoxQuads(box: any) {
    return buildBoxQuadsFromRect(this._rect);
  }
}

Object.setPrototypeOf(NodeBoundsFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

function buildBoxQuadsFromRect([left, top, right, bottom]: number[]) {
  return [
    DOMQuad.fromQuad({
      p1: { x: left, y: top },
      p2: { x: right, y: top },
      p3: { x: right, y: bottom },
      p4: { x: left, y: bottom },
    }),
  ];
}
