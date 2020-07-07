/*
BSD 3-Clause License

Copyright (c) 2020, Web Replay LLC
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// ThreadFront is the main interface used to interact with the singleton
// WRP session. This interface is based on the one normally used when the
// devtools interact with a thread: at any time the thread is either paused
// at a particular point, or resuming on its way to pause at another point.
//
// This model is different from the one used in the WRP, where queries are
// performed on the state at different points in the recording. This layer
// helps with adapting the devtools to the WRP.

const { sendMessage, addEventListener, log } = require("./socket");
const {
  defer,
  assert,
  DisallowEverythingProxyHandler,
  EventEmitter,
  ArrayMap,
} = require("./utils");

// Information about a protocol pause.
function Pause(sessionId) {
  this.sessionId = sessionId;
  this.pauseId = null;

  this.createWaiter = null;

  this.frames = new Map();
  this.scopes = new Map();
  this.objects = new Map();

  this.frameSteps = new Map();

  this.documentNode = undefined;
  this.domFronts = new Map();
}

Pause.prototype = {
  create(point) {
    assert(!this.createWaiter);
    assert(!this.pauseId);
    this.createWaiter = sendMessage("Session.createPause", { point }, this.sessionId).then(
      ({ pauseId, stack, data }) => {
        this.pauseId = pauseId;
        this.addData(data);
        if (stack) {
          this.stack = stack.map(id => this.frames.get(id));
        }
      }
    );
  },

  instantiate(pauseId, data = {}) {
    assert(!this.createWaiter);
    assert(!this.pauseId);
    this.pauseId = pauseId;
    this.addData(data);
  },

  addData({ frames, scopes, objects }) {
    (frames || []).forEach(f => {
      if (!this.frames.has(f.frameId)) {
        this.frames.set(f.frameId, f);
      }
    });
    (scopes || []).forEach(s => {
      if (!this.scopes.has(s.scopeId)) {
        this.scopes.set(s.scopeId, s);
      }
    });
    (objects || []).forEach(o => {
      if (!this.objects.has(o.objectId)) {
        this.objects.set(o.objectId, o);
      }
    });

    (frames || []).forEach(frame => {
      frame.this = new ValueFront(this, frame.this);
    });

    (scopes || []).forEach(scope => {
      if (scope.bindings) {
        const newBindings = [];
        for (const v of scope.bindings) {
          newBindings.push({
            name: v.name,
            originalName: v.originalName,
            value: new ValueFront(this, v),
          });
        }
        scope.bindings = newBindings;
      }
      if (scope.object) {
        scope.object = new ValueFront(this, { object: scope.object });
      }
      if (scope.callee) {
        scope.callee = new ValueFront(this, { object: scope.callee });
      }
    });

    (objects || []).forEach(object => {
      if (object.preview) {
        const { properties, containerEntries, getterValues } = object.preview;

        const newProperties = [];
        for (const p of properties || []) {
          const flags = "flags" in p ? p.flags : 7;
          newProperties.push({
            name: p.name,
            value: new ValueFront(this, p),
            writable: !!(flags & 1),
            configurable: !!(flags & 2),
            enumerable: !!(flags & 4),
            get: p.get ? new ValueFront(this, { object: p.get }) : undefined,
            set: p.set ? new ValueFront(this, { object: p.set }) : undefined,
          });
        }
        object.preview.properties = newProperties;

        const newEntries = [];
        for (const { key, value } of containerEntries || []) {
          newEntries.push({
            key: key ? new ValueFront(this, key) : undefined,
            value: new ValueFront(this, value),
          });
        }
        object.preview.containerEntries = newEntries;

        const newGetterValues = [];
        for (const v of getterValues || []) {
          newGetterValues.push({
            name: v.name,
            value: new ValueFront(this, v),
          });
        }
        object.preview.getterValues = newGetterValues;

        const { prototypeId } = object.preview;
        object.preview.prototypeValue = new ValueFront(
          this,
          prototypeId ? { object: prototypeId } : { value: null }
        );
      }

      this.objects.get(object.objectId).preview = object.preview;
    });
  },

  async getFrames() {
    assert(this.createWaiter);
    await this.createWaiter;
    return this.stack;
  },

  async getScopes(frameId) {
    const frame = this.frames.get(frameId);
    return Promise.all(
      frame.scopeChain.map(async id => {
        if (!this.scopes.has(id)) {
          const { data } = await this.sendMessage("Pause.getScope", {
            scope: id,
          });
          this.addData(data);
        }
        const scope = this.scopes.get(id);
        assert(scope);
        return scope;
      })
    );
  },

  sendMessage(method, params) {
    return sendMessage(method, params, this.sessionId, this.pauseId);
  },

  async getObjectPreview(object) {
    const { data } = await this.sendMessage("Pause.getObjectPreview", {
      object,
    });
    this.addData(data);
  },

  async evaluate(frameId, expression) {
    assert(this.createWaiter);
    await this.createWaiter;
    const { result } = frameId
      ? await this.sendMessage("Pause.evaluateInFrame", { frameId, expression })
      : await this.sendMessage("Pause.evaluateInGlobal", { expression });
    const { returned, exception, failed, data } = result;
    this.addData(data);
    return { returned, exception, failed };
  },

  // Synchronously get a DOM front for an object whose preview is known.
  getDOMFront(objectId) {
    // Make sure we don't create multiple node fronts for the same object.
    if (!objectId) {
      return null;
    }
    if (this.domFronts.has(objectId)) {
      return this.domFronts.get(objectId);
    }
    const data = this.objects.get(objectId);
    assert(data && data.preview);
    let front;
    if (data.preview.node) {
      front = new NodeFront(this, data);
    } else if (data.preview.rule) {
      front = new RuleFront(this, data);
    } else if (data.preview.style) {
      front = new StyleFront(this, data);
    } else if (data.preview.styleSheet) {
      front = new StyleSheetFront(this, data);
    } else {
      throw new Error("Unexpected DOM front");
    }
    this.domFronts.set(objectId, front);
    return front;
  },

  // Asynchronously get a DOM front for an object which might not have a preview.
  async ensureDOMFrontAndParents(nodeId) {
    let parentId = nodeId;
    while (parentId) {
      const data = this.objects.get(parentId);
      if (!data || !data.preview) {
        const { data } = await this.sendMessage("DOM.getParentNodes", { node: parentId });
        this.addData(data);
        break;
      }
      parentId = data.preview.node.parentNode;
    }
    return this.getDOMFront(nodeId);
  },

  async loadDocument() {
    if (this.documentNode) {
      return;
    }
    assert(this.createWaiter);
    await this.createWaiter;
    const { document, data } = await this.sendMessage("DOM.getDocument");
    this.addData(data);
    this.documentNode = this.getDOMFront(document);
  },

  async searchDOM(query) {
    const { nodes, data } = await this.sendMessage("DOM.performSearch", { query });
    this.addData(data);
    return nodes.map(node => this.getDOMFront(node));
  },

  async loadMouseTargets() {
    if (this.loadMouseTargetsWaiter) {
      return this.loadMouseTargetsWaiter.promise;
    }
    this.loadMouseTargetsWaiter = defer();
    const { elements } = await this.sendMessage("DOM.getAllBoundingClientRects");
    this.mouseTargets = elements;
    this.loadMouseTargetsWaiter.resolve();
  },

  async getMouseTarget(x, y) {
    await this.loadMouseTargets();
    for (const { node, rect } of this.mouseTargets) {
      const [left, top, right, bottom] = rect;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return new NodeBoundsFront(this, node, rect);
      }
    }
    return null;
  },

  async getFrameSteps(frameId) {
    if (!this.frameSteps.has(frameId)) {
      const { steps } = await this.sendMessage("Pause.getFrameSteps", {
        frameId,
      });
      this.frameSteps.set(frameId, steps);
    }
    return this.frameSteps.get(frameId);
  },
};

// Manages interaction with a value from a pause.
function ValueFront(pause, protocolValue, elements) {
  this._pause = pause;

  // For primitive values.
  this._hasPrimitive = false;
  this._primitive = undefined;

  // For objects.
  this._object = null;

  // For other kinds of values.
  this._uninitialized = false;
  this._unavailable = false;

  // For arrays of values constructed by the devtools.
  this._elements = null;
  this._isMapEntry = null;

  if (elements) {
    this._elements = elements;
  } else if ("value" in protocolValue) {
    this._hasPrimitive = true;
    this._primitive = protocolValue.value;
  } else if ("object" in protocolValue) {
    const data = pause.objects.get(protocolValue.object);
    assert(data);
    this._object = data;
  } else if ("unserializableNumber" in protocolValue) {
    this._hasPrimitive = true;
    this._primitive = Number(protocolValue.unserializableNumber);
  } else if ("bigint" in protocolValue) {
    this._hasPrimitive = true;
    this._primitive = BigInt(protocolValue.bigint);
  } else if ("uninitialized" in protocolValue) {
    this._uninitialized = true;
  } else if ("unavailable" in protocolValue) {
    this._unavailable = true;
  } else {
    // When there are no keys the value is undefined.
    this._hasPrimitive = true;
  }
}

ValueFront.prototype = {
  getPause() {
    return this._pause;
  },

  id() {
    if (this._object) {
      return `${this._pause.pauseId}:${this._object.objectId}`;
    }
    if (this._hasPrimitive) {
      return String(this._primitive);
    }
    if (this._uninitialized) {
      return "uninitialized";
    }
    if (this._unavailable) {
      return "unavailable";
    }
    if (this._elements) {
      return "elements";
    }
    throw new Error("bad contents");
  },

  isObject() {
    return !!this._object;
  },

  hasPreview() {
    return this._object && this._object.preview;
  },

  hasPreviewOverflow() {
    return !this.hasPreview() || this._object.preview.overflow;
  },

  previewValueMap() {
    const rv = Object.create(null);
    if (this.hasPreview()) {
      for (const { name, value, get, set } of this._object.preview.properties) {
        // For now, ignore getter/setter properties.
        if (!get && !set) {
          rv[name] = value;
        }
      }
      for (const { name, value } of this._object.preview.getterValues) {
        rv[name] = value;
      }
    }
    return rv;
  },

  previewValueCount() {
    return Object.keys(this.previewValueMap()).length;
  },

  previewContainerEntries() {
    if (this.hasPreview()) {
      return this._object.preview.containerEntries;
    }
    return [];
  },

  className() {
    if (this._object) {
      return this._object.className;
    }
  },

  containerEntryCount() {
    return this._object.preview.containerEntryCount;
  },

  regexpString() {
    return this._object.preview.regexpString;
  },

  dateTime() {
    return this._object.preview.dateTime;
  },

  functionName() {
    return this._object.preview.functionName;
  },

  functionParameterNames() {
    return this._object.preview.functionParameterNames;
  },

  functionLocation() {
    const location = this._object.preview.functionLocation;
    if (location) {
      return ThreadFront.getPreferredLocationRaw(location);
    }
  },

  functionLocationURL() {
    const location = this.functionLocation();
    if (location) {
      return ThreadFront.getScriptURLRaw(location.scriptId);
    }
  },

  isString() {
    return this.isPrimitive() && typeof this.primitive() == "string";
  },

  isPrimitive() {
    return this._hasPrimitive;
  },

  primitive() {
    assert(this._hasPrimitive);
    return this._primitive;
  },

  isMapEntry() {
    return this._isMapEntry;
  },

  isUninitialized() {
    return this._uninitialized;
  },

  isUnavailable() {
    return this._unavailable;
  },

  isNode() {
    return !!this._object.preview.node;
  },

  nodeType() {
    return this._object.preview.node.nodeType;
  },

  nodeName() {
    return this._object.preview.node.nodeName;
  },

  isNodeConnected() {
    return this._object.preview.node.isConnected;
  },

  nodeAttributeMap() {
    const rv = Object.create(null);
    const { attributes } = this._object.preview.node;
    for (const { name, value } of attributes || []) {
      rv[name] = value;
    }
    return rv;
  },

  nodePseudoType() {
    return this._object.preview.node.pseudoType;
  },

  documentURL() {
    return this._object.preview.node.documentURL;
  },

  isScope() {
    return false;
  },

  hasChildren() {
    return false;
    //return this.isObject();
  },

  getChildren() {
    if (this._elements) {
      return this._elements;
    }
    if (this.hasPreviewOverflow()) {
      // See ObjectInspectorItem.js
      return [
        {
          name: "Loading…",
          contents: createUnavailableValueFront(),
        },
      ];
    }
    const previewValues = this.previewValueMap();
    const rv = Object.entries(previewValues).map(([name, contents]) => ({
      name,
      contents,
    }));
    if (["Set", "WeakSet", "Map", "WeakMap"].includes(this.className())) {
      const elements = this.previewContainerEntries().map(({ key, value }, i) => {
        if (key) {
          const entryElements = [
            { name: "<key>", contents: key },
            { name: "<value>", contents: value },
          ];
          const entry = createElementsFront(entryElements);
          entry._isMapEntry = { key, value };
          return { name: i.toString(), contents: entry };
        } else {
          return { name: i.toString(), contents: value };
        }
      });
      rv.unshift({
        name: "<entries>",
        contents: createElementsFront(elements),
      });
    }
    rv.push({
      name: "<prototype>",
      contents: this._object.preview.prototypeValue,
    });
    return rv;
  },

  async loadChildren() {
    // Make sure we know all this node's children.
    if (this.isObject() && this.hasPreviewOverflow()) {
      await this.getPause().getObjectPreview(this._object.objectId);
      assert(!this.hasPreviewOverflow());
    }

    const children = this.getChildren();

    // Make sure we have previews for all of this node's object children.
    const promises = [];
    for (const { contents } of children) {
      if (contents.isObject() && !contents.hasPreview()) {
        promises.push(contents.getPause().getObjectPreview(contents._object.objectId));
      }
    }
    await Promise.all(promises);

    for (const { contents } of children) {
      if (contents.isObject()) {
        assert(contents.hasPreview());
      }
    }

    return children;
  },
};

Object.setPrototypeOf(ValueFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

function createPrimitiveValueFront(value) {
  return new ValueFront(null, { value });
}

function createElementsFront(elements) {
  elements.forEach(({ contents }) => contents.isObject());
  return new ValueFront(null, undefined, elements);
}

function createUnavailableValueFront() {
  return new ValueFront(null, { unavailable: true });
}

// Manages interaction with a DOM node.
function NodeFront(pause, data) {
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
  this._quads = null;
  this._bounds = null;
}

NodeFront.prototype = {
  then: undefined,

  isNodeBoundsFront() {
    return false;
  },

  get isConnected() {
    return this._node.isConnected;
  },

  get nodeType() {
    return this._node.nodeType;
  },

  get nodeName() {
    return this._node.nodeName;
  },

  get displayName() {
    return this.nodeName.toLowerCase();
  },

  get tagName() {
    if (this.nodeType == Node.ELEMENT_NODE) {
      return this._node.nodeName;
    }
  },

  get pseudoType() {
    return this._node.pseudoType;
  },

  get pseudoClassLocks() {
    // NYI
    return [];
  },

  get namespaceURI() {
    // NYI
    return undefined;
  },

  get attributes() {
    return this._node.attributes || [];
  },

  getAttribute(name) {
    const attr = this.attributes.find(a => a.name == name);
    return attr ? attr.value : undefined;
  },

  get id() {
    return this.getAttribute("id");
  },

  get className() {
    return this.getAttribute("class") || "";
  },

  get classList() {
    return this.className.split(" ").filter(s => !!s);
  },

  parentNode() {
    return this._pause.getDOMFront(this._node.parentNode);
  },

  parentOrHost() {
    // NYI
    return this.parentNode();
  },

  get hasChildren() {
    return this._node.childNodes && this._node.childNodes.length != 0;
  },

  async childNodes() {
    if (!this._node.childNodes) {
      return [];
    }
    const missingPreviews = this._node.childNodes.filter(id => {
      const data = this._pause.objects.get(id);
      return !data || !data.preview;
    });
    await Promise.all(missingPreviews.map(id => this._pause.getObjectPreview(id)));
    const childNodes = this._node.childNodes.map(id => this._pause.getDOMFront(id));
    await Promise.all(childNodes.map(node => node.ensureLoaded()));
    return childNodes;
  },

  getNodeValue() {
    return this._node.nodeValue;
  },

  get isShadowRoot() {
    // NYI
    return false;
  },

  get isShadowHost() {
    // NYI
    return false;
  },

  get isDirectShadowHostChild() {
    // NYI
    return false;
  },

  async querySelector(selector) {
    const { result, data } = await this._pause.sendMessage("DOM.querySelector", {
      node: this._object.objectId,
      selector,
    });
    this._pause.addData(data);
    return this._pause.getDOMFront(result);
  },

  isLoaded() {
    return this._loaded;
  },

  // Load all data for this node that is needed to select it in the inspector.
  async ensureLoaded() {
    if (this._loadWaiter) {
      return this._loadWaiter.promise;
    }
    this._loadWaiter = defer();

    await Promise.all([
      this._pause
        .sendMessage("CSS.getComputedStyle", { node: this._object.objectId })
        .then(({ computedStyle }) => {
          this._computedStyle = new Map();
          for (const { name, value } of computedStyle) {
            this._computedStyle.set(name, value);
          }
        }),
      this._pause
        .sendMessage("CSS.getAppliedRules", { node: this._object.objectId })
        .then(({ rules, data }) => {
          this._rules = rules;
          this._pause.addData(data);
        }),
      this._pause
        .sendMessage("DOM.getEventListeners", { node: this._object.objectId })
        .then(({ listeners, data }) => {
          this._pause.addData(data);
          this._listeners = listeners.map(listener => ({
            ...listener,
            handler: new ValueFront(this._pause, { object: listener.handler }),
            node: this._pause.getDOMFront(listener.node),
          }));
        }),
      this._pause
        .sendMessage("DOM.getBoxModel", { node: this._object.objectId })
        .then(({ model }) => {
          this._quads = model;
        }),
      this._pause
        .sendMessage("DOM.getBoundingClientRect", {
          node: this._object.objectId,
        })
        .then(({ rect }) => {
          this._bounds = rect;
        }),
    ]);

    this._loaded = true;
    this._loadWaiter.resolve();
  },

  // Ensure that this node and its transitive parents are fully loaded.
  async ensureParentsLoaded() {
    const promises = [];
    let node = this;
    while (node) {
      promises.push(node.ensureLoaded());
      node = node.parentNode();
    }
    return Promise.all(promises);
  },

  get isDisplayed() {
    return this.displayType != "none";
  },

  get displayType() {
    assert(this._loaded);
    return this._computedStyle.get("display");
  },

  getComputedStyle() {
    assert(this._loaded);
    return this._computedStyle;
  },

  get hasEventListeners() {
    assert(this._loaded);
    return this._listeners.length != 0;
  },

  getEventListeners() {
    assert(this._loaded);
    return this._listeners;
  },

  getAppliedRules() {
    assert(this._loaded);
    return this._rules.map(r => this._pause.getDOMFront(r));
  },

  getInlineStyle() {
    if (this._node.style) {
      return this._pause.getDOMFront(this._node.style);
    }
    return null;
  },

  getBoxQuads(box) {
    assert(this._loaded);
    return buildBoxQuads(this._quads[box]);
  },

  getBoundingClientRect() {
    assert(this._loaded);
    const [left, top, right, bottom] = this._bounds;
    return new DOMRect(left, top, right - left, bottom - top);
  },

  get customElementLocation() {
    // NYI
    return undefined;
  },

  get isScrollable() {
    // NYI
    return false;
  },

  get inlineTextChild() {
    // NYI
    return null;
  },

  get getGridFragments() {
    // NYI
    return null;
  },

  get getAsFlexContainer() {
    // NYI
    return null;
  },

  get parentFlexElement() {
    // NYI
    return null;
  },
};

Object.setPrototypeOf(NodeFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

function buildBoxQuads(array) {
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

// Manages interaction with a CSSRule.
function RuleFront(pause, data) {
  this._pause = pause;

  assert(data && data.preview && data.preview.rule);
  this._object = data;
  this._rule = data.preview.rule;
}

RuleFront.prototype = {
  objectId() {
    return this._object.objectId;
  },

  isRule() {
    return true;
  },

  get type() {
    return this._rule.type;
  },

  get cssText() {
    return this._rule.cssText;
  },

  get selectorText() {
    return this._rule.selectorText;
  },

  get selectors() {
    return this._rule.selectorText.split(",").map(s => s.trim());
  },

  get style() {
    if (this._rule.style) {
      return this._pause.getDOMFront(this._rule.style);
    }
    return null;
  },

  get parentStyleSheet() {
    if (this._rule.parentStyleSheet) {
      return this._pause.getDOMFront(this._rule.parentStyleSheet);
    }
    return null;
  },

  get href() {
    return this.parentStyleSheet && this.parentStyleSheet.href;
  },

  get line() {
    return this._rule.startLine;
  },

  get column() {
    return this._rule.startColumn;
  },

  get mediaText() {
    // NYI
    return undefined;
  },
};

Object.setPrototypeOf(RuleFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

// Manages interaction with a CSSStyleDeclaration.
function StyleFront(pause, data) {
  this._pause = pause;

  assert(data && data.preview && data.preview.style);
  this._object = data;
  this._style = data.preview.style;
}

StyleFront.prototype = {
  objectId() {
    return this._object.objectId;
  },

  isRule() {
    return false;
  },

  get properties() {
    return this._style.properties;
  },

  // This stuff is here to allow code to operate on both rules and inline styles.
  get style() {
    return this;
  },
  parentStyleSheet: null,
  mediaText: undefined,
  line: undefined,
  column: undefined,
  type: undefined,
  selectors: undefined,
  href: undefined,
};

Object.setPrototypeOf(StyleFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

// Used by the highlighter when showing the bounding client rect of a node
// that might not be loaded yet, for the node picker.
function NodeBoundsFront(pause, nodeId, rect) {
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

// Manages interaction with a StyleSheet.
function StyleSheetFront(pause, data) {
  this._pause = pause;

  assert(data && data.preview && data.preview.styleSheet);
  this._object = data;
  this._styleSheet = data.preview.styleSheet;
}

StyleSheetFront.prototype = {
  get href() {
    return this._styleSheet.href;
  },

  get nodeHref() {
    return this.href;
  },

  get isSystem() {
    return this._styleSheet.isSystem;
  },
};

Object.setPrototypeOf(StyleSheetFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

const ThreadFront = {
  // When replaying there is only a single thread currently. Use this thread ID
  // everywhere needed throughout the devtools client.
  actor: "MainThreadId",

  currentPoint: "0",
  currentPointHasFrames: false,

  // Any pause for the current point.
  currentPause: null,

  // Pauses created for async parent frames of the current point.
  asyncPauses: [],

  sessionId: null,
  sessionWaiter: defer(),

  // Map scriptId to info about the script.
  scripts: new Map(),

  // Resolve hooks for promises waiting on a script ID to be known.
  scriptWaiters: new ArrayMap(),

  // Map URL to scriptId[].
  urlScripts: new ArrayMap(),

  // Script IDs which have a pretty printed alternative.
  minifiedScripts: new Set(),

  skipPausing: false,

  // Points which will be reached when stepping in various directions from a point.
  resumeTargets: new Map(),

  // Epoch which invalidates step targets when advanced.
  resumeTargetEpoch: 0,

  // Pauses for each point we have stopped or might stop at.
  allPauses: new Map(),

  // Map breakpointId to information about the breakpoint, for all installed breakpoints.
  breakpoints: new Map(),

  setOnEndpoint(onEndpoint) {
    assert(!this.onEndpoint);
    this.onEndpoint = onEndpoint;
  },

  async setSessionId(sessionId) {
    this.sessionId = sessionId;
    this.sessionWaiter.resolve(sessionId);

    log(`GotSessionId ${sessionId}`);

    const { endpoint } = await sendMessage("Session.getEndpoint", {}, sessionId);
    if (this.onEndpoint) {
      this.onEndpoint(endpoint);
    }

    // Make sure the debugger has added a pause listener before warping to the endpoint.
    await gToolbox.startPanel("debugger");

    this.timeWarp(endpoint.point, endpoint.time);
  },

  setTest(test) {
    this.testName = test;
  },

  waitForSession() {
    return this.sessionWaiter.promise;
  },

  async ensureProcessed(onMissingRegions, onUnprocessedRegions) {
    const sessionId = await this.waitForSession();

    addEventListener("Session.missingRegions", onMissingRegions);
    addEventListener("Session.unprocessedRegions", onUnprocessedRegions);

    await sendMessage("Session.ensureProcessed", {}, sessionId);
    if (this.testName) {
      await gToolbox.selectTool("debugger");
      window.Test = require("test/harness");
      const script = document.createElement("script");
      script.src = `/test?${this.testName}`;
      document.head.appendChild(script);
    }
  },

  timeWarp(point, time, hasFrames) {
    log(`TimeWarp ${point}`);
    this.currentPoint = point;
    this.currentPointHasFrames = hasFrames;
    this.currentPause = null;
    this.asyncPauses.length = 0;
    this.emit("paused", { point, time });

    this._precacheResumeTargets();
  },

  async findScripts(onScript) {
    const sessionId = await this.waitForSession();
    this.onScript = onScript;

    sendMessage("Debugger.findScripts", {}, sessionId);
    addEventListener("Debugger.scriptParsed", script => {
      let { scriptId, kind, url, generatedScriptIds } = script;
      this.scripts.set(scriptId, { kind, url, generatedScriptIds });
      if (url) {
        this.urlScripts.add(url, scriptId);
      }
      if (kind == "prettyPrinted") {
        this.minifiedScripts.add(generatedScriptIds[0]);
      }
      const waiters = this.scriptWaiters.map.get(scriptId);
      (waiters || []).forEach(resolve => resolve());
      this.scriptWaiters.map.delete(scriptId);
      onScript(script);
    });
  },

  getScriptKind(scriptId) {
    return this.scripts.get(scriptId).kind;
  },

  async ensureScript(scriptId) {
    if (!this.scripts.has(scriptId)) {
      const { promise, resolve } = defer();
      this.scriptWaiters.add(scriptId, resolve);
      await promise;
    }
    return this.scripts.get(scriptId);
  },

  getScriptURLRaw(scriptId) {
    const info = this.scripts.get(scriptId);
    return info && info.url;
  },

  async getScriptURL(scriptId) {
    const info = await this.ensureScript(scriptId);
    return info.url;
  },

  getScriptIdsForURL(url) {
    return this.urlScripts.map.get(url) || [];
  },

  async getScriptSource(scriptId) {
    const { scriptSource, contentType } = await sendMessage(
      "Debugger.getScriptSource",
      { scriptId },
      this.sessionId
    );
    return { scriptSource, contentType };
  },

  async getBreakpointPositionsCompressed(scriptId, range) {
    const begin = range ? range.start : undefined;
    const end = range ? range.end : undefined;
    const { lineLocations } = await sendMessage(
      "Debugger.getPossibleBreakpoints",
      { scriptId, begin, end },
      this.sessionId
    );
    return lineLocations;
  },

  setSkipPausing(skip) {
    this.skipPausing = skip;
  },

  async setBreakpoint(scriptId, line, column, condition) {
    const location = { scriptId, line, column };
    try {
      const { breakpointId } = await sendMessage(
        "Debugger.setBreakpoint",
        { location, condition },
        this.sessionId
      );
      if (breakpointId) {
        this.breakpoints.set(breakpointId, { location });
        this._invalidateResumeTargets();
      }
    } catch (e) {
      // An error will be generated if the breakpoint location is not valid for
      // this script. We don't keep precise track of which locations are valid
      // for which inline scripts in an HTML file (which share the same URL),
      // so ignore these errors.
    }
  },

  setBreakpointByURL(url, line, column, condition) {
    const scripts = this.urlScripts.map.get(url);
    if (!scripts) {
      return;
    }
    const scriptId = this.getPreferredScriptId(scripts);
    return this.setBreakpoint(scriptId, line, column, condition);
  },

  async removeBreakpoint(scriptId, line, column) {
    for (const [breakpointId, { location }] of this.breakpoints.entries()) {
      if (location.scriptId == scriptId && location.line == line && location.column == column) {
        this.breakpoints.delete(breakpointId);
        await sendMessage("Debugger.removeBreakpoint", { breakpointId }, this.sessionId);
        this._invalidateResumeTargets();
      }
    }
  },

  removeBreakpointByURL(url, line, column) {
    const scripts = this.urlScripts.map.get(url);
    if (!scripts) {
      return;
    }
    const scriptId = this.getPreferredScriptId(scripts);
    return this.removeBreakpoint(scriptId, line, column);
  },

  ensurePause(point) {
    let pause = this.allPauses.get(point);
    if (pause) {
      return pause;
    }
    pause = new Pause(this.sessionId);
    pause.create(point);
    this.allPauses.set(point, pause);
    return pause;
  },

  ensureCurrentPause() {
    if (!this.currentPause) {
      this.currentPause = this.ensurePause(this.currentPoint);
    }
  },

  getFrames() {
    if (!this.currentPointHasFrames) {
      return [];
    }

    this.ensureCurrentPause();
    return this.currentPause.getFrames();
  },

  lastAsyncPause() {
    this.ensureCurrentPause();
    return this.asyncPauses.length
      ? this.asyncPauses[this.asyncPauses.length - 1]
      : this.currentPause;
  },

  async loadAsyncParentFrames() {
    const basePause = this.lastAsyncPause();
    const baseFrames = await basePause.getFrames();
    if (!baseFrames) {
      return [];
    }
    const steps = await basePause.getFrameSteps(baseFrames[baseFrames.length - 1].frameId);
    if (basePause != this.lastAsyncPause()) {
      return [];
    }
    const entryPause = this.ensurePause(steps[0].point);
    this.asyncPauses.push(entryPause);
    const frames = await entryPause.getFrames();
    if (entryPause != this.lastAsyncPause()) {
      return [];
    }
    return frames.slice(1);
  },

  pauseForAsyncIndex(asyncIndex) {
    this.ensureCurrentPause();
    return asyncIndex ? this.asyncPauses[asyncIndex - 1] : this.currentPause;
  },

  getScopes(asyncIndex, frameId) {
    return this.pauseForAsyncIndex(asyncIndex).getScopes(frameId);
  },

  async evaluate(asyncIndex, frameId, text) {
    const pause = this.pauseForAsyncIndex();
    const rv = await pause.evaluate(frameId, text);
    if (rv.returned) {
      rv.returned = new ValueFront(pause, rv.returned);
    } else if (rv.exception) {
      rv.exception = new ValueFront(pause, rv.exception);
    }
    return rv;
  },

  // Preload step target information and pause data for nearby points.
  async _precacheResumeTargets() {
    if (!this.currentPointHasFrames) {
      return;
    }

    const point = this.currentPoint;
    const epoch = this.resumeTargetEpoch;

    // Each step command, and the transitive steps to queue up after that step is known.
    const stepCommands = [
      {
        command: "Debugger.findReverseStepOverTarget",
        transitive: ["Debugger.findReverseStepOverTarget", "Debugger.findStepInTarget"],
      },
      {
        command: "Debugger.findStepOverTarget",
        transitive: ["Debugger.findStepOverTarget", "Debugger.findStepInTarget"],
      },
      {
        command: "Debugger.findStepInTarget",
        transitive: ["Debugger.findStepOutTarget", "Debugger.findStepInTarget"],
      },
      {
        command: "Debugger.findStepOutTarget",
        transitive: [
          "Debugger.findReverseStepOverTarget",
          "Debugger.findStepOverTarget",
          "Debugger.findStepInTarget",
          "Debugger.findStepOutTarget",
        ],
      },
    ];

    stepCommands.forEach(async ({ command, transitive }) => {
      const target = await this._findResumeTarget(point, command);
      if (epoch != this.resumeTargetEpoch || !target.frame) {
        return;
      }

      // Precache pause data for the point.
      this.ensurePause(target.point);

      if (point != this.currentPoint) {
        return;
      }

      // Look for transitive resume targets.
      transitive.forEach(async command => {
        const transitiveTarget = await this._findResumeTarget(target.point, command);
        if (
          epoch != this.resumeTargetEpoch ||
          point != this.currentPoint ||
          !transitiveTarget.frame
        ) {
          return;
        }
        this.ensurePause(transitiveTarget.point);
      });
    });
  },

  _invalidateResumeTargets() {
    this.resumeTargets.clear();
    this.resumeTargetEpoch++;
    this._precacheResumeTargets();
  },

  async _findResumeTarget(point, command) {
    // Check already-known resume targets.
    const key = `${point}:${command}`;
    const knownTarget = this.resumeTargets.get(key);
    if (knownTarget) {
      return knownTarget;
    }

    const epoch = this.resumeTargetEpoch;
    const { target } = await sendMessage(command, { point }, this.sessionId);
    if (epoch == this.resumeTargetEpoch) {
      this.resumeTargets.set(key, target);
    }

    return target;
  },

  async _resumeOperation(command, selectedPoint) {
    let resumeEmitted = false;
    let resumeTarget = null;

    const warpToTarget = () => {
      const { point, time, frame } = resumeTarget;
      this.timeWarp(point, time, !!frame);
    };

    setTimeout(() => {
      resumeEmitted = true;
      this.emit("resumed");
      if (resumeTarget) {
        setTimeout(warpToTarget, 0);
      }
    }, 0);

    const point = selectedPoint || this.currentPoint;
    const target = await this._findResumeTarget(point, command);
    resumeTarget = target;
    if (resumeEmitted) {
      warpToTarget();
    }
  },

  rewind(point) {
    this._resumeOperation("Debugger.findRewindTarget", point);
  },
  resume(point) {
    this._resumeOperation("Debugger.findResumeTarget", point);
  },
  reverseStepOver(point) {
    this._resumeOperation("Debugger.findReverseStepOverTarget", point);
  },
  stepOver(point) {
    this._resumeOperation("Debugger.findStepOverTarget", point);
  },
  stepIn(point) {
    this._resumeOperation("Debugger.findStepInTarget", point);
  },
  stepOut(point) {
    this._resumeOperation("Debugger.findStepOutTarget", point);
  },

  async blackbox(scriptId, begin, end) {
    await sendMessage("Debugger.blackboxScript", { scriptId, begin, end }, this.sessionId);
    this._invalidateResumeTargets();
  },

  async unblackbox(scriptId, begin, end) {
    await sendMessage("Debugger.unblackboxScript", { scriptId, begin, end }, this.sessionId);
    this._invalidateResumeTargets();
  },

  async findConsoleMessages(onConsoleMessage) {
    const sessionId = await this.waitForSession();

    sendMessage("Console.findMessages", {}, sessionId);
    addEventListener("Console.newMessage", ({ message }) => {
      const pause = new Pause(this.sessionId);
      pause.instantiate(message.pauseId, message.data);
      if (message.argumentValues) {
        message.argumentValues = message.argumentValues.map(v => new ValueFront(pause, v));
      }
      onConsoleMessage(pause, message);
    });
  },

  async getRootDOMNode() {
    if (!this.sessionId) {
      return null;
    }
    this.ensureCurrentPause();
    const pause = this.currentPause;
    await this.currentPause.loadDocument();
    return pause == this.currentPause ? this.getKnownRootDOMNode() : null;
  },

  getKnownRootDOMNode() {
    assert(this.currentPause.documentNode !== undefined);
    return this.currentPause.documentNode;
  },

  async searchDOM(query) {
    if (!this.sessionId) {
      return [];
    }
    this.ensureCurrentPause();
    const pause = this.currentPause;
    const nodes = await this.currentPause.searchDOM(query);
    return pause == this.currentPause ? nodes : null;
  },

  async loadMouseTargets() {
    if (!this.sessionId) {
      return;
    }
    const pause = this.currentPause;
    this.ensureCurrentPause();
    await this.currentPause.loadMouseTargets();
    return pause == this.currentPause;
  },

  async getMouseTarget(x, y) {
    if (!this.sessionId) {
      return null;
    }
    const pause = this.currentPause;
    this.ensureCurrentPause();
    const nodeBounds = await this.currentPause.getMouseTarget(x, y);
    return pause == this.currentPause ? nodeBounds : null;
  },

  async ensureNodeLoaded(objectId) {
    const pause = this.currentPause;
    const node = await pause.ensureDOMFrontAndParents(objectId);
    if (pause != this.currentPause) {
      return null;
    }
    await node.ensureParentsLoaded();
    return pause == this.currentPause ? node : null;
  },

  getFrameSteps(asyncIndex, frameId) {
    return this.pauseForAsyncIndex(asyncIndex).getFrameSteps(frameId);
  },

  getPreferredLocationRaw(locations) {
    const scriptId = this.getPreferredScriptId(locations.map(l => l.scriptId));
    return locations.find(l => l.scriptId == scriptId);
  },

  async getPreferredLocation(locations) {
    await Promise.all(locations.map(({ scriptId }) => this.ensureScript(scriptId)));
    return this.getPreferredLocationRaw(locations);
  },

  getScriptIdScore(scriptId) {
    const info = this.scripts.get(scriptId);
    if (!info) {
      // Ideally this would never happen, but scripts might still be loading...
      return 0;
    }
    const { generatedScriptIds, kind } = info;

    let score = 1;

    // Score more-original scripts higher than less-original scripts.
    if (generatedScriptIds) {
      score += this.getScriptIdScore(generatedScriptIds[0]);
    }

    // Score source mapped scripts higher than pretty-printed scripts.
    if (kind == "sourceMapped") {
      score++;
    }

    return score;
  },

  getPreferredScriptId(scriptIds) {
    scriptIds.sort((a, b) => this.getScriptIdScore(a) - this.getScriptIdScore(b));
    return scriptIds[scriptIds.length - 1];
  },

  // Get the location to use for a generated location without alternatives.
  async getPreferredMappedLocation(location) {
    const { mappedLocation } = await sendMessage(
      "Debugger.getMappedLocation",
      { location },
      this.sessionId
    );
    return this.getPreferredLocation(mappedLocation);
  },

  async getDescription(recordingId) {
    let description;
    try {
      description = await sendMessage("Recording.getDescription", {
        recordingId,
      });
    } catch (e) {
      // Getting the description will fail if it was never set. For now we don't
      // set the last screen in this case.
      const sessionId = await this.waitForSession();
      const { endpoint } = await sendMessage("Session.getEndpoint", {}, sessionId);
      description = { duration: endpoint.time };
    }

    return description;
  },
};

EventEmitter.decorate(ThreadFront);

module.exports = {
  ThreadFront,
  ValueFront,
  Pause,
  createPrimitiveValueFront,
  createUnavailableValueFront,
  createElementsFront,
};
