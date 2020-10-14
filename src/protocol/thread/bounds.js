const { DisallowEverythingProxyHandler } = require("../utils");

// Used by the highlighter when showing the bounding client rect of a node
// that might not be loaded yet, for the node picker.
export function NodeBoundsFront(pause, nodeId, rect) {
  this._pause = pause;
  this._rect = rect;

  this.nodeId = nodeId;
}

NodeBoundsFront.prototype = {
  then: undefined,

  isNodeBoundsFront() {
    return true;
  },

  getBoxQuads(box) {
    return buildBoxQuadsFromRect(this._rect);
  },
};

Object.setPrototypeOf(NodeBoundsFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

function buildBoxQuadsFromRect([left, top, right, bottom]) {
  return [
    DOMQuad.fromQuad({
      p1: { x: left, y: top },
      p2: { x: right, y: top },
      p3: { x: right, y: bottom },
      p4: { x: left, y: bottom },
    }),
  ];
}
