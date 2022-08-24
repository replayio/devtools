/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { NodeBoundsFront } from "protocol/thread/bounds";
import { NodeFront } from "protocol/thread/node";

/**
 * Get box quads adjusted for iframes and zoom level.
 *
 * Warning: this function returns things that look like DOMQuad objects but
 * aren't (they resemble an old version of the spec). Unlike the return value
 * of node.getBoxQuads, they have a .bounds property and not a .getBounds()
 * method.
 *
 * @param {DOMWindow} boundaryWindow
 *        The window where to stop to iterate. If `null` is given, the top
 *        window is used.
 * @param {DOMNode} node
 *        The node for which we are to get the box model region
 *        quads.
 * @param {String} region
 *        The box model region to return: "content", "padding", "border" or
 *        "margin".
 * @param {Object} [options.ignoreZoom=false]
 *        Ignore zoom used in the context of e.g. canvas.
 * @return {Array}
 *        An array of objects that have the same structure as quads returned by
 *        getBoxQuads. An empty array if the node has no quads or is invalid.
 */
export function getAdjustedQuads(
  boundaryWindow: Window,
  node: NodeFront | null | undefined,
  region: any,
  { ignoreZoom, ignoreScroll }: { ignoreZoom?: boolean; ignoreScroll?: boolean } = {}
) {
  if (!node || !node.getBoxQuads) {
    return [];
  }

  const quads = node.getBoxQuads(region);

  if (!quads || !quads.length) {
    return [];
  }

  const scale = 1;
  const { scrollX, scrollY } = ignoreScroll ? { scrollX: 0, scrollY: 0 } : boundaryWindow;

  const xOffset = scrollX * scale;
  const yOffset = scrollY * scale;

  const adjustedQuads = [];
  for (const quad of quads) {
    const bounds = quad.getBounds();
    adjustedQuads.push({
      p1: {
        w: quad.p1.w * scale,
        x: quad.p1.x * scale + xOffset,
        y: quad.p1.y * scale + yOffset,
        z: quad.p1.z * scale,
      },
      p2: {
        w: quad.p2.w * scale,
        x: quad.p2.x * scale + xOffset,
        y: quad.p2.y * scale + yOffset,
        z: quad.p2.z * scale,
      },
      p3: {
        w: quad.p3.w * scale,
        x: quad.p3.x * scale + xOffset,
        y: quad.p3.y * scale + yOffset,
        z: quad.p3.z * scale,
      },
      p4: {
        w: quad.p4.w * scale,
        x: quad.p4.x * scale + xOffset,
        y: quad.p4.y * scale + yOffset,
        z: quad.p4.z * scale,
      },
      bounds: {
        bottom: bounds.bottom * scale + yOffset,
        height: bounds.height * scale,
        left: bounds.left * scale + xOffset,
        right: bounds.right * scale + xOffset,
        top: bounds.top * scale + yOffset,
        width: bounds.width * scale,
        x: bounds.x * scale + xOffset,
        y: bounds.y * scale + yOffset,
      },
    });
  }

  return adjustedQuads;
}

/**
 * Check if a node and its document are still alive
 * and attached to the window.
 *
 * @param {DOMNode} node
 * @return {Boolean}
 */
export function isNodeConnected(node: HTMLElement) {
  if (!node.ownerDocument || !node.ownerDocument.defaultView) {
    return false;
  }

  try {
    return !(
      node.compareDocumentPosition(node.ownerDocument.documentElement) &
      node.DOCUMENT_POSITION_DISCONNECTED
    );
  } catch (e) {
    // "can't access dead object" error
    return false;
  }
}

/**
 * Determine whether a node is a ::marker pseudo.
 *
 * @param {DOMNode} node
 * @return {Boolean}
 */
export function isMarkerPseudoElement(node: HTMLElement) {
  return node.nodeName === "_moz_generated_content_marker";
}

/**
 * Determine whether a node is a ::before pseudo.
 *
 * @param {DOMNode} node
 * @return {Boolean}
 */
export function isBeforePseudoElement(node: HTMLElement) {
  return node.nodeName === "_moz_generated_content_before";
}

/**
 * Determine whether a node is a ::after pseudo.
 *
 * @param {DOMNode} node
 * @return {Boolean}
 */
export function isAfterPseudoElement(node: HTMLElement) {
  return node.nodeName === "_moz_generated_content_after";
}

/**
 * Returns the viewport's dimensions for the `window` given.
 *
 * @return {Object} An object with `width` and `height` properties, representing the
 * number of pixels for the viewport's size.
 */
export function getViewportDimensions() {
  const canvas = document.getElementById("graphics")! as HTMLCanvasElement;
  return { width: canvas.width, height: canvas.height };
}
