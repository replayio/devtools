/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { getViewportDimensions } from "devtools/shared/layout/utils";
import { NodeBoundsFront } from "protocol/thread/bounds";
import { NodeFront } from "protocol/thread/node";

const lazyContainer = {
  get CssLogic() {
    return require("third-party/css-logic/actors-inspector-css-logic").CssLogic;
  },
};

export const getComputedStyle = (node: HTMLElement) =>
  lazyContainer.CssLogic.getComputedStyle(node);

export const getBindingElementAndPseudo = (node: HTMLElement) =>
  lazyContainer.CssLogic.getBindingElementAndPseudo(node);

const SVG_NS = "http://www.w3.org/2000/svg";
const XHTML_NS = "http://www.w3.org/1999/xhtml";
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

/**
 * Returns true if a DOM node is "valid", where "valid" means that the node isn't a dead
 * object wrapper, is still attached to a document, and is of a given type.
 * @param {DOMNode} node
 * @param {Number} nodeType Optional, defaults to ELEMENT_NODE
 * @return {Boolean}
 */
export function isNodeValid(
  node: NodeFront | NodeBoundsFront | undefined,
  nodeType = Node.ELEMENT_NODE
) {
  // Is it still alive?
  if (!node) {
    return false;
  }

  // NodeBoundsFront objects don't have information about the node itself,
  // but are only constructed for valid, connected elements.
  if (node.isNodeBoundsFront()) {
    return true;
  }

  // Is it of the right type?
  if ((node as NodeFront).nodeType !== nodeType) {
    return false;
  }

  // Is the node connected to the document?
  if (!(node as NodeFront).isConnected) {
    return false;
  }

  return true;
}

/**
 * Helper function that creates SVG DOM nodes.
 * @param {Window} This window's document will be used to create the element
 * @param {Object} Options for the node include:
 * - nodeType: the type of node, defaults to "box".
 * - attributes: a {name:value} object to be used as attributes for the node.
 * - prefix: a string that will be used to prefix the values of the id and class
 *   attributes.
 * - parent: if provided, the newly created element will be appended to this
 *   node.
 */
export function createSVGNode(win: Window, options: NodeCreationOptions) {
  if (!options.nodeType) {
    options.nodeType = "box";
  }
  options.namespace = SVG_NS;
  return createNode(win, options);
}

interface NodeCreationOptions {
  nodeType?: string;
  attributes: Record<string, any>;
  parent?: Element;
  text?: string;
  prefix?: string;
  namespace?: string;
}

/**
 * Helper function that creates DOM nodes.
 * @param {Window} This window's document will be used to create the element
 * @param {Object} Options for the node include:
 * - nodeType: the type of node, defaults to "div".
 * - namespace: the namespace to use to create the node, defaults to XHTML namespace.
 * - attributes: a {name:value} object to be used as attributes for the node.
 * - prefix: a string that will be used to prefix the values of the id and class
 *   attributes.
 * - parent: if provided, the newly created element will be appended to this
 *   node.
 * - text: if provided, set the text content of the element.
 */
export function createNode(win: Window, options: NodeCreationOptions) {
  const type = options.nodeType || "div";
  const namespace = options.namespace || XHTML_NS;
  const doc = win.document;

  const node = doc.createElementNS(namespace, type);

  for (const name in options.attributes || {}) {
    let value = options.attributes[name];
    if (options.prefix && (name === "class" || name === "id")) {
      value = options.prefix + value;
    }
    node.setAttribute(name, value);
  }

  if (options.parent) {
    options.parent.appendChild(node);
  }

  if (options.text) {
    node.appendChild(doc.createTextNode(options.text));
  }

  return node;
}

/**
 * Every highlighters should insert their markup content into the document's
 * canvasFrame anonymous content container (see dom/webidl/Document.webidl).
 *
 * Since this container gets cleared when the document navigates, highlighters
 * should use this helper to have their markup content automatically re-inserted
 * in the new document.
 *
 * Since the markup content is inserted in the canvasFrame using
 * insertAnonymousContent, this means that it can be modified using the API
 * described in AnonymousContent.webidl.
 * To retrieve the AnonymousContent instance, use the content getter.
 *
 * @param {HighlighterEnv} highlighterEnv
 *        The environemnt which windows will be used to insert the node.
 * @param {Function} nodeBuilder
 *        A function that, when executed, returns a DOM node to be inserted into
 *        the canvasFrame.
 */
export class CanvasFrameAnonymousContentHelper {
  listeners = new Map();
  elements = new Map();
  anonymousContentDocument: Document | null = document;
  highlighterEnv: any;
  nodeBuilder: any;
  _content: HTMLElement | null = null;

  constructor(highlighterEnv: any, nodeBuilder: any) {
    this.highlighterEnv = highlighterEnv;
    this.nodeBuilder = nodeBuilder;

    this._onWindowReady();
  }

  destroy() {
    this._remove();
    if (this.highlighterEnv) {
      this.highlighterEnv.off("window-ready", this._onWindowReady);
      this.highlighterEnv = this.nodeBuilder = this._content = null;
    }
    this.anonymousContentDocument = null;

    this._removeAllListeners();
    this.elements.clear();
  }

  _insert() {
    const node = this.nodeBuilder();

    const container = document.getElementById("highlighter-root");
    container?.appendChild(node);
    this._content = node;
  }

  _remove() {
    const container = document.getElementById("highlighter-root");
    if (container && container.firstChild) {
      container.removeChild(container.firstChild);
    }
    this._content = null;
  }

  /**
   * The "window-ready" event can be triggered when:
   *   - a new window is created
   *   - a window is unfrozen from bfcache
   *   - when first attaching to a page
   *   - when swapping frame loaders (moving tabs, toggling RDM)
   */
  _onWindowReady() {
    this._removeAllListeners();
    this.elements.clear();
    this._insert();
    this.anonymousContentDocument = document;
  }

  getComputedStylePropertyValue(id: string, property: string) {
    if (this.content) {
      const node = this.content.querySelector(`#${id}`)!;
      const computed = window.getComputedStyle(node);
      return computed.getPropertyValue(property);
    }
  }

  getTextContentForElement(id: string) {
    if (this.content) {
      const node = this.content.querySelector<HTMLElement>(`#${id}`)!;
      return node!.innerText;
    }
  }

  setTextContentForElement(id: string, text: string) {
    if (this.content) {
      const node = this.content.querySelector<HTMLElement>(`#${id}`)!;
      node.innerText = text;
    }
  }

  setAttributeForElement(id: string, name: string, value: string) {
    if (this.content) {
      const node = this.content.querySelector(`#${id}`)!;
      node.setAttribute(name, value);
    }
  }

  getAttributeForElement(id: string, name: string) {
    if (this.content) {
      const node = this.content.querySelector(`#${id}`)!;
      return node.getAttribute(name);
    }
    return "";
  }

  removeAttributeForElement(id: string, name: string) {
    if (this.content) {
      const node = this.content.querySelector(`#${id}`)!;
      node.removeAttribute(name);
    }
  }

  hasAttributeForElement(id: string, name: string) {
    return typeof this.getAttributeForElement(id, name) === "string";
  }

  /**
   * Add an event listener to one of the elements inserted in the canvasFrame
   * native anonymous container.
   * Like other methods in this helper, this requires the ID of the element to
   * be passed in.
   *
   * Note that if the content page navigates, the event listeners won't be
   * added again.
   *
   * Also note that unlike traditional DOM events, the events handled by
   * listeners added here will propagate through the document only through
   * bubbling phase, so the useCapture parameter isn't supported.
   * It is possible however to call e.stopPropagation() to stop the bubbling.
   *
   * IMPORTANT: the chrome-only canvasFrame insertion API takes great care of
   * not leaking references to inserted elements to chrome JS code. That's
   * because otherwise, chrome JS code could freely modify native anon elements
   * inside the canvasFrame and probably change things that are assumed not to
   * change by the C++ code managing this frame.
   * See https://wiki.mozilla.org/DevTools/Highlighter#The_AnonymousContent_API
   * Unfortunately, the inserted nodes are still available via
   * event.originalTarget, and that's what the event handler here uses to check
   * that the event actually occured on the right element, but that also means
   * consumers of this code would be able to access the inserted elements.
   * Therefore, the originalTarget property will be nullified before the event
   * is passed to your handler.
   *
   * IMPL DETAIL: A single event listener is added per event types only, at
   * browser level and if the event originalTarget is found to have the provided
   * ID, the callback is executed (and then IDs of parent nodes of the
   * originalTarget are checked too).
   *
   * @param {String} id
   * @param {String} type
   * @param {Function} handler
   */
  addEventListenerForElement(id: string, type: string, handler: () => void) {
    if (typeof id !== "string") {
      throw new Error("Expected a string ID in addEventListenerForElement but" + " got: " + id);
    }

    // If no one is listening for this type of event yet, add one listener.
    if (!this.listeners.has(type)) {
      const target = this.highlighterEnv.pageListenerTarget;
      target.addEventListener(type, this, true);
      // Each type entry in the map is a map of ids:handlers.
      this.listeners.set(type, new Map());
    }

    const listeners = this.listeners.get(type);
    listeners.set(id, handler);
  }

  /**
   * Remove an event listener from one of the elements inserted in the
   * canvasFrame native anonymous container.
   * @param {String} id
   * @param {String} type
   */
  removeEventListenerForElement(id: string, type: string) {
    const listeners = this.listeners.get(type);
    if (!listeners) {
      return;
    }
    listeners.delete(id);

    // If no one is listening for event type anymore, remove the listener.
    if (!this.listeners.has(type)) {
      const target = this.highlighterEnv.pageListenerTarget;
      target.removeEventListener(type, this, true);
    }
  }

  handleEvent(event: Event) {
    const listeners = this.listeners.get(event.type);
    if (!listeners) {
      return;
    }

    // Hide the originalTarget property to avoid exposing references to native
    // anonymous elements. See addEventListenerForElement's comment.
    let isPropagationStopped = false;
    const eventProxy = new Proxy(event, {
      get: (obj, name) => {
        if (name === "originalTarget") {
          return null;
        } else if (name === "stopPropagation") {
          return () => {
            isPropagationStopped = true;
          };
        }
        // @ts-expect-error
        return obj[name];
      },
    });

    // Start at originalTarget, bubble through ancestors and call handlers when
    // needed.
    let node = (event as any).originalTarget;
    while (node) {
      const handler = listeners.get(node.id);
      if (handler) {
        handler(eventProxy, node.id);
        if (isPropagationStopped) {
          break;
        }
      }
      node = node.parentNode;
    }
  }

  _removeAllListeners() {
    if (this.highlighterEnv && this.highlighterEnv.pageListenerTarget) {
      const target = this.highlighterEnv.pageListenerTarget;
      for (const [type] of this.listeners) {
        target.removeEventListener(type, this, true);
      }
    }
    this.listeners.clear();
  }

  getElement(id: string) {
    if (this.elements.has(id)) {
      return this.elements.get(id);
    }

    const element = {
      getTextContent: () => this.getTextContentForElement(id),
      setTextContent: (text: string) => this.setTextContentForElement(id, text),
      setAttribute: (name: string, val: string) => this.setAttributeForElement(id, name, val),
      getAttribute: (name: string) => this.getAttributeForElement(id, name),
      removeAttribute: (name: string) => this.removeAttributeForElement(id, name),
      hasAttribute: (name: string) => this.hasAttributeForElement(id, name),
      addEventListener: (type: string, handler: () => void) => {
        return this.addEventListenerForElement(id, type, handler);
      },
      removeEventListener: (type: string, handler: () => void) => {
        return this.removeEventListenerForElement(id, type);
      },
      computedStyle: {
        getPropertyValue: (property: string) => this.getComputedStylePropertyValue(id, property),
      },
    };

    this.elements.set(id, element);

    return element;
  }

  get content() {
    return this._content;
  }
}

/**
 * Move the infobar to the right place in the highlighter. This helper method is utilized
 * in both css-grid.js and box-model.js to help position the infobar in an appropriate
 * space over the highlighted node element or grid area. The infobar is used to display
 * relevant information about the highlighted item (ex, node or grid name and dimensions).
 *
 * This method will first try to position the infobar to top or bottom of the container
 * such that it has enough space for the height of the infobar. Afterwards, it will try
 * to horizontally center align with the container element if possible.
 *
 * @param  {DOMNode} container
 *         The container element which will be used to position the infobar.
 * @param  {Object} bounds
 *         The content bounds of the container element.
 * @param  {Window} win
 *         The window object.
 * @param  {Object} [options={}]
 *         Advanced options for the infobar.
 * @param  {String} options.position
 *         Force the infobar to be displayed either on "top" or "bottom". Any other value
 *         will be ingnored.
 * @param  {Boolean} options.hideIfOffscreen
 *         If set to `true`, hides the infobar if it's offscreen, instead of automatically
 *         reposition it.
 */
export function moveInfobar(
  container: HTMLElement,
  bounds: DOMRect,
  win: Window,
  options: { position?: "top" | "bottom"; hideIfOffscreen?: boolean } = {}
) {
  const zoom = 1;
  const viewport = getViewportDimensions();

  const { computedStyle } = container as any;

  const margin = 2;
  const arrowSize = parseFloat(computedStyle.getPropertyValue("--highlighter-bubble-arrow-size"));
  const containerHeight = parseFloat(computedStyle.getPropertyValue("height"));
  const containerWidth = parseFloat(computedStyle.getPropertyValue("width"));
  const containerHalfWidth = containerWidth / 2;

  const viewportWidth = viewport.width * zoom;
  const viewportHeight = viewport.height * zoom;
  let { pageXOffset, pageYOffset } = win;

  pageYOffset *= zoom;
  pageXOffset *= zoom;

  // Defines the boundaries for the infobar.
  const topBoundary = margin;
  const bottomBoundary = viewportHeight - containerHeight - margin - 1;
  const leftBoundary = containerHalfWidth + margin;
  const rightBoundary = viewportWidth - containerHalfWidth - margin;

  // Set the default values.
  let top = bounds.y - containerHeight - arrowSize;
  const bottom = bounds.bottom + margin + arrowSize;
  let left = bounds.x + bounds.width / 2;
  let isOverlapTheNode = false;
  let positionAttribute = "top";
  let position = "absolute";

  // Here we start the math.
  // We basically want to position absolutely the infobar, except when is pointing to a
  // node that is offscreen or partially offscreen, in a way that the infobar can't
  // be placed neither on top nor on bottom.
  // In such cases, the infobar will overlap the node, and to limit the latency given
  // by APZ (See Bug 1312103) it will be positioned as "fixed".
  // It's a sort of "position: sticky" (but positioned as absolute instead of relative).
  const canBePlacedOnTop = top >= pageYOffset;
  const canBePlacedOnBottom = bottomBoundary + pageYOffset - bottom > 0;
  const forcedOnTop = options.position === "top";
  const forcedOnBottom = options.position === "bottom";

  if ((!canBePlacedOnTop && canBePlacedOnBottom && !forcedOnTop) || forcedOnBottom) {
    top = bottom;
    positionAttribute = "bottom";
  }

  const isOffscreenOnTop = top < topBoundary + pageYOffset;
  const isOffscreenOnBottom = top > bottomBoundary + pageYOffset;
  const isOffscreenOnLeft = left < leftBoundary + pageXOffset;
  const isOffscreenOnRight = left > rightBoundary + pageXOffset;

  if (isOffscreenOnTop) {
    top = topBoundary;
    isOverlapTheNode = true;
  } else if (isOffscreenOnBottom) {
    top = bottomBoundary;
    isOverlapTheNode = true;
  } else if (isOffscreenOnLeft || isOffscreenOnRight) {
    isOverlapTheNode = true;
    top -= pageYOffset;
  }

  if (isOverlapTheNode && options.hideIfOffscreen) {
    container.setAttribute("hidden", "true");
    return;
  } else if (isOverlapTheNode) {
    left = Math.min(Math.max(leftBoundary, left - pageXOffset), rightBoundary);

    position = "fixed";
    container.setAttribute("hide-arrow", "true");
  } else {
    position = "absolute";
    container.removeAttribute("hide-arrow");
  }

  // We need to scale the infobar Independently from the highlighter's container;
  // otherwise the `position: fixed` won't work, since "any value other than `none` for
  // the transform, results in the creation of both a stacking context and a containing
  // block. The object acts as a containing block for fixed positioned descendants."
  // (See https://www.w3.org/TR/css-transforms-1/#transform-rendering)
  // We also need to shift the infobar 50% to the left in order for it to appear centered
  // on the element it points to.
  container.setAttribute(
    "style",
    `
    position:${position};
    transform-origin: 0 0;
    transform: scale(${1 / zoom}) translate(calc(${left}px - 50%), ${top}px)`
  );

  container.setAttribute("position", positionAttribute);
}
