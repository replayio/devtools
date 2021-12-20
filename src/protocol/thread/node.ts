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
import { RuleFront } from "./rule";
import uniqBy from "lodash/uniqBy";
const HTML_NS = "http://www.w3.org/1999/xhtml";

export interface WiredEventListener {
  handler: ValueFront;
  node: NodeFront;
  type: string;
  capture: boolean;
}

export interface WiredAppliedRule {
  rule: RuleFront;
  pseudoElement?: string;
}

// Manages interaction with a DOM node.
export class NodeFront {
  then = undefined;
  private _pause: Pause;
  private _object: WiredObject;
  private _node: NodeDescription;
  private _frameworkListenersWaiter: Deferred<FrameworkEventListener[]> | null;
  private _quads: BoxModel | null;

  private _waiters: {
    computedStyle: Deferred<Map<string, string> | null> | null;
    rules: Deferred<WiredAppliedRule[] | null> | null;
    listeners: Deferred<WiredEventListener[] | null> | null;
    quads: Deferred<BoxModel | null> | null;
    bounds: Deferred<DOMRect | null> | null;
  };

  constructor(pause: Pause, data: WiredObject) {
    this._pause = pause;

    // The contents of the Node must already be available.
    assert(data && data.preview && data.preview.node);
    this._object = data;
    this._node = data.preview.node;

    // Additional data that can be loaded for the node.
    this._frameworkListenersWaiter = null;
    this._waiters = {
      computedStyle: null,
      rules: null,
      listeners: null,
      quads: null,
      bounds: null,
    };

    this._quads = null;
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

  // Load all data for this node that is needed to select it in the inspector.
  async getComputedStyle() {
    if (!this._waiters.computedStyle) {
      this._waiters.computedStyle = defer();
      try {
        const { computedStyle } = await this._pause.sendMessage(client.CSS.getComputedStyle, {
          node: this._object.objectId,
        });
        const computedStyleMap = new Map();
        for (const { name, value } of computedStyle) {
          computedStyleMap.set(name, value);
        }
        this._waiters.computedStyle.resolve(computedStyleMap);
      } catch (e) {
        this._waiters.computedStyle.resolve(null);
      }
    }

    return this._waiters.computedStyle.promise;
  }

  // Whether or not the node is displayed.
  async isDisplayed() {
    return (await this.getDisplayType()) != "none";
  }

  // The computed display style property value of the node.
  async getDisplayType() {
    return (await this.getComputedStyle())?.get("display");
  }

  // Whether or not the node has event listeners.
  async hasEventListeners() {
    if (!this._waiters.listeners?.promise) {
      await this.getEventListeners();
    }
    const listeners = await this._waiters.listeners?.promise;
    return listeners?.length !== 0;
  }

  async getEventListeners() {
    if (!this._waiters.listeners) {
      this._waiters.listeners = defer();
      try {
        const { listeners, data } = await this._pause.sendMessage(client.DOM.getEventListeners, {
          node: this._object.objectId,
        });
        this._pause.addData(data);
        const wiredListeners = listeners.map(listener => ({
          ...listener,
          handler: new ValueFront(this._pause, { object: listener.handler }),
          node: this._pause.getNodeFront(listener.node),
        }));
        this._waiters.listeners.resolve(wiredListeners);
      } catch (e) {
        this._waiters.listeners.resolve(null);
      }
    }

    return this._waiters.listeners.promise;
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

  async getAppliedRules() {
    if (!this._waiters.rules) {
      this._waiters.rules = defer();
      try {
        const { rules, data } = await this._pause.sendMessage(client.CSS.getAppliedRules, {
          node: this._object.objectId,
        });
        this._pause.addData(data);
        const uniqueRules = uniqBy(
          rules,
          (rule: AppliedRule) => `${rule.rule}|${rule.pseudoElement}`
        );
        this._waiters.rules.resolve(
          uniqueRules.map(({ rule, pseudoElement }) => {
            return { rule: this._pause.getRuleFront(rule), pseudoElement };
          })
        );
      } catch (e) {
        this._waiters.rules.resolve(null);
      }
    }

    return this._waiters.rules.promise;
  }

  getInlineStyle() {
    if (this._node.style) {
      return this._pause.getStyleFront(this._node.style);
    }
    return null;
  }

  async getBoxModel() {
    if (!this._waiters.quads) {
      this._waiters.quads = defer();
      try {
        const { model } = await this._pause.sendMessage(client.DOM.getBoxModel, {
          node: this._object.objectId,
        });
        this._quads = model;
        this._waiters.quads.resolve(model);
      } catch (e) {
        this._waiters.quads.resolve(null);
      }
    }

    return this._waiters.quads.promise;
  }

  getBoxQuads(box: "content" | "padding" | "border" | "margin") {
    if (!this._quads) {
      return null;
    }

    return buildBoxQuads(this._quads[box]);
  }

  async getBoundingClientRect() {
    if (!this._waiters.bounds) {
      this._waiters.bounds = defer();
      try {
        const { rect } = await this._pause.sendMessage(client.DOM.getBoundingClientRect, {
          node: this._object.objectId,
        });
        const [left, top, right, bottom] = rect;
        this._waiters.bounds.resolve(new DOMRect(left, top, right - left, bottom - top));
      } catch (e) {
        this._waiters.bounds.resolve(null);
      }
    }

    return this._waiters.bounds.promise;
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
