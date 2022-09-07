/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import EventEmitter from "devtools/shared/event-emitter";
import nodeConstants from "devtools/shared/dom-node-constants";
import type { NodeFront } from "protocol/thread/node";

export type SelectionReason =
  | "navigateaway"
  | "markup"
  | "debugger"
  | "breadcrumbs"
  | "inspectorsearch"
  | "box-model"
  | "console"
  | "keyboard"
  | "unknown";

type SelectionEvent =
  | "new-node-front" // when the inner node changed
  | "attribute-changed" // when an attribute is changed
  | "detached-front" // when the node (or one of its parents) is removed from the document
  | "reparented" // when the node (or one of its parents) is moved under a different node
  | "pseudoclass"; // (unsure);

/**
 * Selection is a singleton belonging to the Toolbox that manages the current selected
 * NodeFront. In addition, it provides some helpers about the context of the selected
 * node.
 *
 * API
 *
 *   new Selection()
 *   destroy()
 *   nodeFront (readonly)
 *   setNodeFront(node, origin="unknown")selection
 *
 * Helpers:
 *
 *   window
 *   document
 *   isRoot()
 *   isNode()
 *
 */
export class Selection {
  private _nodeFront: NodeFront | undefined | null;
  private _isSlotted: boolean;
  reason: SelectionReason | undefined;

  constructor() {
    EventEmitter.decorate(this);

    // A single node front can be represented twice on the client when the node is a slotted
    // element. It will be displayed once as a direct child of the host element, and once as
    // a child of a slot in the "shadow DOM". The latter is called the slotted version.
    this._isSlotted = false;

    this.setNodeFront = this.setNodeFront.bind(this);
  }

  destroy() {}

  /**
   * Update the currently selected node-front.
   *
   * @param {NodeFront} nodeFront
   *        The NodeFront being selected.
   * @param {Object} (optional)
   *        - {String} reason: Reason that triggered the selection, will be fired with
   *          the "new-node-front" event.
   *        - {Boolean} isSlotted: Is the selection representing the slotted version of
   *          the node.
   */
  setNodeFront(
    nodeFront: NodeFront | null,
    {
      reason = "unknown",
    }: Partial<{
      reason: SelectionReason | undefined;
      isSlotted: boolean;
    }> = {}
  ) {
    this.reason = reason;

    if (this._nodeFront == null && nodeFront == null) {
      // Avoid to notify multiple "unselected" events with a null/undefined nodeFront
      // (e.g. once when the webpage start to navigate away from the current webpage,
      // and then again while the new page is being loaded).
      return;
    }

    this._nodeFront = nodeFront;

    this.emit("new-node-front", nodeFront, this.reason);
  }

  get nodeFront() {
    return this._nodeFront;
  }

  isNode() {
    return !!this._nodeFront;
  }

  isConnected() {
    let node = this._nodeFront;
    return node && node.isConnected;
  }

  // Node type

  isElementNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.ELEMENT_NODE;
  }

  isPseudoElementNode() {
    return this.isNode() && !this.nodeFront!.pseudoType;
  }

  // added by EventEmitter.decorate(this) in the constructor
  eventListeners!: Map<string, ((...args: any[]) => void)[]>;
  on!: (name: SelectionEvent, handler: (...args: any[]) => void) => void;
  off!: (name: SelectionEvent, handler: (...args: any[]) => void) => void;
  emit!: (name: SelectionEvent, ...args: any[]) => void;
}

export const selection = new Selection();

export default Selection;
