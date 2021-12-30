/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EventEmitter = require("devtools/shared/event-emitter");

const nodeConstants = require("devtools/shared/dom-node-constants");

import { NodeFront } from "protocol/thread/node";

export type NodeSelectionReason =
  | "navigateaway"
  | "markup"
  | "debugger"
  | "unknown"
  | "breadcrumbs"
  | "inspectorsearch"
  | "box-model"
  | "console"
  | "keyboard";

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
 *   isHTMLNode()
 *
 * Check the nature of the node:
 *
 *   isElementNode()
 *   isAttributeNode()
 *   isTextNode()
 *   isCDATANode()
 *   isEntityRefNode()
 *   isEntityNode()
 *   isProcessingInstructionNode()
 *   isCommentNode()
 *   isDocumentNode()
 *   isDocumentTypeNode()
 *   isDocumentFragmentNode()
 *   isNotationNode()
 *
 * Events:
 *   "new-node-front" when the inner node changed
 *   "attribute-changed" when an attribute is changed
 *   "detached-front" when the node (or one of its parents) is removed from
 *   the document
 *   "reparented" when the node (or one of its parents) is moved under
 *   a different node
 */
class Selection {
  private _nodeFront: NodeFront | undefined | null;
  private _isSlotted: boolean;
  reason: NodeSelectionReason | undefined;

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
      isSlotted = false,
    }: Partial<{
      reason: NodeSelectionReason | undefined;
      isSlotted: boolean;
    }> = {}
  ) {
    this.reason = reason;

    // If an inlineTextChild text node is being set, then set it's parent instead.
    /*
    const parentNode = nodeFront && nodeFront.parentNode();
    if (nodeFront && parentNode && parentNode.inlineTextChild === nodeFront) {
      nodeFront = parentNode;
    }
    */

    if (this._nodeFront == null && nodeFront == null) {
      // Avoid to notify multiple "unselected" events with a null/undefined nodeFront
      // (e.g. once when the webpage start to navigate away from the current webpage,
      // and then again while the new page is being loaded).
      return;
    }

    this._isSlotted = isSlotted;
    this._nodeFront = nodeFront;

    this.emit("new-node-front", nodeFront, this.reason);
  }

  get nodeFront() {
    return this._nodeFront;
  }

  isRoot() {
    // NYI : NodeFront#isDocumentElement doesn't exist yet
    return false; // this.isNode() && this.isConnected() && this._nodeFront.isDocumentElement;
  }

  isNode() {
    return !!this._nodeFront;
  }

  isConnected() {
    let node = this._nodeFront;
    return node && node.isConnected;
  }

  isHTMLNode() {
    return this.isNode();
  }

  // Node type

  isElementNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.ELEMENT_NODE;
  }

  isPseudoElementNode() {
    return this.isNode() && !this.nodeFront!.pseudoType;
  }

  isAnonymousNode() {
    return false;
    //return this.isNode() && this.nodeFront.isAnonymous;
  }

  isAttributeNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.ATTRIBUTE_NODE;
  }

  isTextNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.TEXT_NODE;
  }

  isCDATANode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.CDATA_SECTION_NODE;
  }

  isEntityRefNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.ENTITY_REFERENCE_NODE;
  }

  isEntityNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.ENTITY_NODE;
  }

  isProcessingInstructionNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.PROCESSING_INSTRUCTION_NODE;
  }

  isCommentNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.PROCESSING_INSTRUCTION_NODE;
  }

  isDocumentNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.DOCUMENT_NODE;
  }

  /**
   * @returns true if the selection is the <body> HTML element.
   */
  isBodyNode() {
    return this.isHTMLNode() && this.isConnected() && this.nodeFront!.nodeName === "BODY";
  }

  /**
   * @returns true if the selection is the <head> HTML element.
   */
  isHeadNode() {
    return this.isHTMLNode() && this.isConnected() && this.nodeFront!.nodeName === "HEAD";
  }

  isDocumentTypeNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.DOCUMENT_TYPE_NODE;
  }

  isDocumentFragmentNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.DOCUMENT_FRAGMENT_NODE;
  }

  isNotationNode() {
    return this.isNode() && this.nodeFront!.nodeType == nodeConstants.NOTATION_NODE;
  }

  isSlotted() {
    return this._isSlotted;
  }

  isShadowRootNode() {
    return this.isNode() && this.nodeFront!.isShadowRoot;
  }

  // added by EventEmitter.decorate(ThreadFront)
  eventListeners!: Map<string, ((...args: any[]) => void)[]>;
  on!: (name: string, handler: (...args: any[]) => void) => void;
  off!: (name: string, handler: (...args: any[]) => void) => void;
  emit!: (name: string, ...args: any[]) => void;
}

export default Selection;
