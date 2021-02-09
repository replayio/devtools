import {
  Node as NodeDescription,
  AppliedRule,
  BoxModel,
  Rect,
  Quads,
} from "@recordreplay/protocol";
import { client } from "../socket";
import { Pause, WiredObject } from "./pause";
import { defer, assert, DisallowEverythingProxyHandler, Deferred } from "../utils";
import { FrameworkEventListener, getFrameworkEventListeners } from "../event-listeners";
import { ValueFront } from "./value";
const { uniqBy } = require("lodash");
const HTML_NS = "http://www.w3.org/1999/xhtml";

export interface WiredEventListener {
  handler: ValueFront;
  node: NodeFront;
  type: string;
  capture: boolean;
}

// Manages interaction with a DOM node.
export class NodeFront {
  then = undefined;
  private _pause: Pause;
  private _object: WiredObject;
  private _node: NodeDescription;
  private _loadWaiter: Deferred<void> | null;
  private _loaded: boolean;
  private _computedStyle: Map<string, string> | null;
  private _rules: AppliedRule[] | null;
  private _listeners: WiredEventListener[] | null;
  private _frameworkListenersWaiter: Deferred<FrameworkEventListener[]> | null;
  private _quads: BoxModel | null;
  private _bounds: Rect | null;

  constructor(pause: Pause, data: WiredObject) {
    this._pause = pause;

    // The contents of the Node must already be available.
    assert(data && data.preview && data.preview.node);
    this._object = data;
    this._node = data.preview.node;

    // Additional data that can be loaded for the node.
    this._loadWaiter = null;
    this._loaded = false;
    this._computedStyle = null;
    this._rules = null;
    this._listeners = null;
    this._frameworkListenersWaiter = null;
    this._quads = null;
    this._bounds = null;
  }

  get pause() {
    return this._pause;
  }

  objectId() {
    return this._object.objectId;
  }

  getObjectFront() {
    return new ValueFront(this._pause, { object: this._object.objectId });
  }

  isNodeBoundsFront() {
    return false;
  }

  get isConnected() {
    return this._node.isConnected;
  }

  // The node's `nodeType` which identifies what the node is.
  get nodeType() {
    return this._node.nodeType;
  }

  get nodeName() {
    return this._node.nodeName;
  }

  get displayName() {
    return this.nodeName.toLowerCase();
  }

  // The name of the current node.
  get tagName() {
    if (this.nodeType == Node.ELEMENT_NODE) {
      return this._node.nodeName;
    }
  }

  // The pseudo element type.
  get pseudoType() {
    return this._node.pseudoType;
  }

  get pseudoClassLocks() {
    // NYI
    return [];
  }

  // The namespace URI of the node.
  get namespaceURI() {
    // NYI
    return HTML_NS;
  }

  get doctypeString() {
    return `<!DOCTYPE ${this.nodeName}>`;
  }

  // A list of the node's attributes.
  get attributes() {
    return this._node.attributes || [];
  }

  getAttribute(name: string) {
    const attr = this.attributes.find(a => a.name == name);
    return attr ? attr.value : undefined;
  }

  get id() {
    return this.getAttribute("id");
  }

  get className() {
    return this.getAttribute("class") || "";
  }

  get classList() {
    return this.className.split(" ").filter(s => !!s);
  }

  parentNode() {
    return this._node.parentNode ? this._pause.getNodeFront(this._node.parentNode) : null;
  }

  parentOrHost() {
    // NYI
    return this.parentNode();
  }

  // Whether or not the node has child nodes.
  get hasChildren() {
    return this._node.childNodes && this._node.childNodes.length != 0;
  }

  async childNodes() {
    if (!this._node.childNodes) {
      return [];
    }
    const missingPreviews = this._node.childNodes.filter(id => {
      const data = this._pause.objects.get(id);
      return !data || !data.preview;
    });
    await Promise.all(missingPreviews.map(id => this._pause.getObjectPreview(id)));
    const childNodes = this._node.childNodes.map(id => this._pause.getNodeFront(id));
    await Promise.all(childNodes.map(node => node.ensureLoaded()));
    return childNodes;
  }

  // The node's `nodeValue` which identifies the value of the current node.
  getNodeValue() {
    return this._node.nodeValue;
  }

  get isShadowRoot() {
    // NYI
    return false;
  }

  get isShadowHost() {
    // NYI
    return false;
  }

  get isDirectShadowHostChild() {
    // NYI
    return false;
  }

  async querySelector(selector: string) {
    const { result, data } = await this._pause.sendMessage(client.DOM.querySelector, {
      node: this._object.objectId,
      selector,
    });
    this._pause.addData(data);
    return result ? this._pause.getNodeFront(result) : null;
  }

  isLoaded() {
    return this._loaded;
  }

  // Load all data for this node that is needed to select it in the inspector.
  async ensureLoaded() {
    if (this._loadWaiter) {
      return this._loadWaiter.promise;
    }
    this._loadWaiter = defer();

    await Promise.all([
      this._pause
        .sendMessage(client.CSS.getComputedStyle, { node: this._object.objectId })
        .then(({ computedStyle }) => {
          this._computedStyle = new Map();
          for (const { name, value } of computedStyle) {
            this._computedStyle.set(name, value);
          }
        }),
      this._pause.sendMessage(client.CSS.getAppliedRules, { node: this._object.objectId }).then(
        ({ rules, data }) => {
          this._rules = uniqBy(rules, (rule: AppliedRule) => `${rule.rule}|${rule.pseudoElement}`);
          this._pause.addData(data);
        },
        () => {
          this._rules = null;
        }
      ),
      this._pause
        .sendMessage(client.DOM.getEventListeners, { node: this._object.objectId })
        .then(({ listeners, data }) => {
          this._pause.addData(data);
          this._listeners = listeners.map(listener => ({
            ...listener,
            handler: new ValueFront(this._pause, { object: listener.handler }),
            node: this._pause.getNodeFront(listener.node),
          }));
        }),
      this._pause.sendMessage(client.DOM.getBoxModel, { node: this._object.objectId }).then(
        ({ model }) => {
          this._quads = model;
        },
        () => {
          this._quads = null;
        }
      ),
      this._pause
        .sendMessage(client.DOM.getBoundingClientRect, {
          node: this._object.objectId,
        })
        .then(
          ({ rect }) => {
            this._bounds = rect;
          },
          () => {
            this._bounds = null;
          }
        ),
    ]);
    this._loaded = true;
    this._loadWaiter!.resolve();
  }

  // Ensure that this node and its transitive parents are fully loaded.
  async ensureParentsLoaded() {
    const promises = [];
    let node: NodeFront | null = this;
    while (node) {
      promises.push(node.ensureLoaded());
      node = node.parentNode();
    }
    return Promise.all(promises);
  }

  // Whether or not the node is displayed.
  get isDisplayed() {
    return this.displayType != "none";
  }

  // The computed display style property value of the node.
  get displayType() {
    assert(this._loaded);
    return this._computedStyle!.get("display");
  }

  getComputedStyle() {
    assert(this._loaded);
    return this._computedStyle;
  }

  // Whether or not the node has event listeners.
  get hasEventListeners() {
    assert(this._loaded);
    return this._listeners!.length != 0;
  }

  getEventListeners() {
    assert(this._loaded);
    return this._listeners!;
  }

  async getFrameworkEventListeners() {
    if (this._frameworkListenersWaiter) {
      return this._frameworkListenersWaiter.promise;
    }
    this._frameworkListenersWaiter = defer<FrameworkEventListener[]>();
    const listeners = await getFrameworkEventListeners(this);
    this._frameworkListenersWaiter.resolve(listeners);
    return listeners;
  }

  getAppliedRules() {
    assert(this._loaded);
    if (this._rules === null) {
      return null;
    }
    return this._rules.map(({ rule, pseudoElement }) => {
      return { rule: this._pause.getRuleFront(rule), pseudoElement };
    });
  }

  getInlineStyle() {
    if (this._node.style) {
      return this._pause.getStyleFront(this._node.style);
    }
    return null;
  }

  getBoxQuads(box: "content" | "padding" | "border" | "margin") {
    assert(this._loaded);
    return this._quads ? buildBoxQuads(this._quads[box]) : null;
  }

  getBoundingClientRect() {
    assert(this._loaded);
    if (!this._bounds) {
      return null;
    }
    const [left, top, right, bottom] = this._bounds;
    return new DOMRect(left, top, right - left, bottom - top);
  }

  get customElementLocation() {
    // NYI
    return undefined;
  }

  // Whether or not the node is scrollable.
  get isScrollable() {
    // NYI
    return false;
  }

  get inlineTextChild() {
    // NYI
    return null;
  }

  get getGridFragments() {
    // NYI
    return null;
  }

  get getAsFlexContainer() {
    // NYI
    return null;
  }

  get parentFlexElement() {
    // NYI
    return null;
  }
}

Object.setPrototypeOf(NodeFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

function buildBoxQuads(array: Quads) {
  assert(array.length % 8 == 0);
  array = [...array];
  const rv = [];
  while (array.length) {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = array.splice(0, 8);
    rv.push(
      DOMQuad.fromQuad({
        p1: { x: x1, y: y1 },
        p2: { x: x2, y: y2 },
        p3: { x: x3, y: y3 },
        p4: { x: x4, y: y4 },
      })
    );
  }
  return rv;
}
