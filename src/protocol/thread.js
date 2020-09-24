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
const { getFrameworkEventListeners } = require("./event-listeners");
const { ELEMENT_STYLE } = require("devtools/client/inspector/rules/constants");
const { MappedLocationCache } = require("./mapped-location-cache");
const HTML_NS = "http://www.w3.org/1999/xhtml";

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

  addData(...datas) {
    datas.forEach(d => this._addDataObjects(d));
    datas.forEach(d => this._updateDataFronts(d));
  },

  _addDataObjects({ frames, scopes, objects }) {
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
  },

  _updateDataFronts({ frames, scopes, objects }) {
    (frames || []).forEach(frame => {
      frame.this = new ValueFront(this, frame.this);
    });

    (scopes || []).forEach(scope => {
      if (scope.bindings) {
        const newBindings = [];
        for (const v of scope.bindings) {
          newBindings.push({
            name: v.name,
            value: new ValueFront(this, v),
          });
        }
        scope.bindings = newBindings;
      }
      if (scope.object) {
        scope.object = new ValueFront(this, { object: scope.object });
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

  ensureScopeChain(scopeChain) {
    return Promise.all(
      scopeChain.map(async id => {
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

  async getScopes(frameId) {
    const frame = this.frames.get(frameId);

    // Normally we use the original scope chain for the frame if there is one,
    // but when a generated script is marked as preferred we use the generated
    // scope chain instead. In the original case we still load the frame's
    // normal scope chain first, as currently the backend does not supply
    // related objects when loading original scopes and we don't deal with that
    // properly.
    let scopeChain = await this.ensureScopeChain(frame.scopeChain);
    if (frame.originalScopeChain && !ThreadFront.hasPreferredGeneratedScript(frame.location)) {
      scopeChain = await this.ensureScopeChain(frame.originalScopeChain);
    }

    return scopeChain;
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
      ? await this.sendMessage("Pause.evaluateInFrame", {
          frameId,
          expression,
          useOriginalScopes: true,
        })
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
  this._isBigInt = false;

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
    this._isBigInt = true;
    this._primitive = protocolValue.bigint;
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

  // When the function came from a logpoint and hasn't had its location
  // mapped yet, this should be used to avoid confusing getPreferredLocation.
  functionLocationFromLogpoint() {
    const location = this._object.preview.functionLocation;
    if (location) {
      return location[0];
    }
  },

  isString() {
    return this.isPrimitive() && typeof this.primitive() == "string" && !this._isBigInt;
  },

  isPrimitive() {
    return this._hasPrimitive;
  },

  isBigInt() {
    return this._isBigInt;
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

  isNodeBoundsFront() {
    return false;
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
    rv.sort((a, b) => {
      const _a = a.name?.toUpperCase();
      const _b = b.name?.toUpperCase();
      return _a < _b ? -1 : _a > _b ? 1 : 0;
    });
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
  this._frameworkListenersWaiter = null;
  this._quads = null;
  this._bounds = null;
}

NodeFront.prototype = {
  then: undefined,

  objectId() {
    return this._object.objectId;
  },

  getObjectFront() {
    return new ValueFront(this._pause, { object: this._object.objectId });
  },

  isNodeBoundsFront() {
    return false;
  },

  get isConnected() {
    return this._node.isConnected;
  },

  // The node's `nodeType` which identifies what the node is.
  get nodeType() {
    return this._node.nodeType;
  },

  get nodeName() {
    return this._node.nodeName;
  },

  get displayName() {
    return this.nodeName.toLowerCase();
  },

  // The name of the current node.
  get tagName() {
    if (this.nodeType == Node.ELEMENT_NODE) {
      return this._node.nodeName;
    }
  },

  // The pseudo element type.
  get pseudoType() {
    return this._node.pseudoType;
  },

  get pseudoClassLocks() {
    // NYI
    return [];
  },

  // The namespace URI of the node.
  get namespaceURI() {
    // NYI
    return HTML_NS;
  },

  get doctypeString() {
    // NYI
    return "unknown";
  },

  // A list of the node's attributes.
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

  // Whether or not the node has child nodes.
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

  // The node's `nodeValue` which identifies the value of the current node.
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

  // Whether or not the node is displayed.
  get isDisplayed() {
    return this.displayType != "none";
  },

  // The computed display style property value of the node.
  get displayType() {
    assert(this._loaded);
    return this._computedStyle.get("display");
  },

  getComputedStyle() {
    assert(this._loaded);
    return this._computedStyle;
  },

  // Whether or not the node has event listeners.
  get hasEventListeners() {
    assert(this._loaded);
    return this._listeners.length != 0;
  },

  getEventListeners() {
    assert(this._loaded);
    return this._listeners;
  },

  async getFrameworkEventListeners() {
    if (this._frameworkListenersWaiter) {
      return this._frameworkListenersWaiter.promise;
    }
    this._frameworkListenersWaiter = defer();
    const listeners = getFrameworkEventListeners(this);
    this._frameworkListenersWaiter.resolve(listeners);
    return listeners;
  },

  getAppliedRules() {
    assert(this._loaded);
    return this._rules.map(({ rule, pseudoElement }) => {
      return { rule: this._pause.getDOMFront(rule), pseudoElement };
    });
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

  // Whether or not the node is scrollable.
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

  /**
   * The type of CSS rule.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CSSRule#Type_constants.
   */
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
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.href;
    }
    return this.parentStyleSheet && this.parentStyleSheet.href;
  },

  /**
   * Whether or not the rule is an user agent style.
   */
  get isSystem() {
    return this.parentStyleSheet && this.parentStyleSheet.isSystem;
  },

  get line() {
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.startLine;
    }
    return this._rule.startLine;
  },

  get column() {
    if (this._rule.originalLocation) {
      return this._rule.originalLocation.startColumn;
    }
    return this._rule.startColumn;
  },

  get mediaText() {
    // NYI
    return undefined;
  },
};

Object.setPrototypeOf(RuleFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

// Manages interaction with a CSSStyleDeclaration. StyleFront represents an inline
// element style.
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

  get type() {
    return ELEMENT_STYLE;
  },

  parentStyleSheet: null,
  mediaText: undefined,
  line: undefined,
  column: undefined,
  selectors: undefined,
  href: undefined,
  isSystem: false,
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

  // Recording ID being examined.
  recordingId: null,

  // Waiter for the associated session ID.
  sessionId: null,
  sessionWaiter: defer(),

  // Waiter which resolves when the debugger has loaded and we've warped to the endpoint.
  initializedWaiter: defer(),

  // Map scriptId to info about the script.
  scripts: new Map(),

  // Resolve hooks for promises waiting on a script ID to be known.
  scriptWaiters: new ArrayMap(),

  // Map URL to scriptId[].
  urlScripts: new ArrayMap(),

  // Map scriptId to scriptId[], reversing the generatedScriptIds map.
  originalScripts: new ArrayMap(),

  // Script IDs for generated scripts which should be preferred over any
  // original script.
  preferredGeneratedScripts: new Set(),

  mappedLocations: new MappedLocationCache(),

  skipPausing: false,

  // Points which will be reached when stepping in various directions from a point.
  resumeTargets: new Map(),

  // Epoch which invalidates step targets when advanced.
  resumeTargetEpoch: 0,

  // How many in flight commands can change resume targets we get from the server.
  numPendingInvalidateCommands: 0,

  // Resolve hooks for promises waiting for pending invalidate commands to finish. wai
  invalidateCommandWaiters: [],

  // Pauses for each point we have stopped or might stop at.
  allPauses: new Map(),

  // Map breakpointId to information about the breakpoint, for all installed breakpoints.
  breakpoints: new Map(),

  // Any callback to invoke to adjust the point which we zoom to.
  warpCallback: null,

  async setSessionId(sessionId) {
    this.sessionId = sessionId;
    this.mappedLocations.sessionId = sessionId;
    this.sessionWaiter.resolve(sessionId);

    log(`GotSessionId ${sessionId}`);

    const { endpoint } = await sendMessage("Session.getEndpoint", {}, sessionId);
    this.emit("endpoint", endpoint);
  },

  async initializeToolbox() {
    const sessionId = await this.waitForSession();
    const { endpoint } = await sendMessage("Session.getEndpoint", {}, sessionId);

    // Make sure the debugger has added a pause listener before warping to the endpoint.
    await gToolbox.startPanel("debugger");
    this.timeWarp(endpoint.point, endpoint.time, /* hasFrames */ false, /* force */ true);
    this.initializedWaiter.resolve();

    if (this.testName) {
      sendMessage("Internal.labelTestSession", { sessionId });
      await gToolbox.selectTool("debugger");
      window.Test = require("test/harness");
      const script = document.createElement("script");
      script.src = `/test?${this.testName}`;
      document.head.appendChild(script);
    }
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
  },

  timeWarp(point, time, hasFrames, force) {
    log(`TimeWarp ${point}`);

    // The warp callback is used to change the locations where the thread is
    // warping to.
    if (this.warpCallback && !force) {
      const newTarget = this.warpCallback(point, time, hasFrames);
      if (newTarget) {
        point = newTarget.point;
        time = newTarget.time;
        hasFrames = newTarget.hasFrames;
      }
    }

    this.currentPoint = point;
    this.currentPointHasFrames = hasFrames;
    this.currentPause = null;
    this.asyncPauses.length = 0;
    this.emit("paused", { point, hasFrames, time });

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
      for (const generatedId of generatedScriptIds || []) {
        this.originalScripts.add(generatedId, scriptId);
      }
      const waiters = this.scriptWaiters.map.get(scriptId);
      (waiters || []).forEach(resolve => resolve());
      this.scriptWaiters.map.delete(scriptId);
      onScript(script);
    });
  },

  getScriptKind(scriptId) {
    const info = this.scripts.get(scriptId);
    return info ? info.kind : null;
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
      this._invalidateResumeTargets(async () => {
        const { breakpointId } = await sendMessage(
          "Debugger.setBreakpoint",
          { location, condition },
          this.sessionId
        );
        if (breakpointId) {
          this.breakpoints.set(breakpointId, { location });
        }
      });
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
    const scriptIds = this._chooseScriptIdList(scripts);
    return Promise.all(
      scriptIds.map(({ scriptId }) => {
        this.setBreakpoint(scriptId, line, column, condition);
      })
    );
  },

  async removeBreakpoint(scriptId, line, column) {
    for (const [breakpointId, { location }] of this.breakpoints.entries()) {
      if (location.scriptId == scriptId && location.line == line && location.column == column) {
        this.breakpoints.delete(breakpointId);
        this._invalidateResumeTargets(async () => {
          await sendMessage("Debugger.removeBreakpoint", { breakpointId }, this.sessionId);
        });
      }
    }
  },

  removeBreakpointByURL(url, line, column) {
    const scripts = this.urlScripts.map.get(url);
    if (!scripts) {
      return;
    }
    const scriptIds = this._chooseScriptIdList(scripts);
    return Promise.all(
      scriptIds.map(({ scriptId }) => {
        this.removeBreakpoint(scriptId, line, column);
      })
    );
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

  // Perform an operation that will change our cached targets about where resume
  // operations will finish.
  async _invalidateResumeTargets(callback) {
    this.resumeTargets.clear();
    this.resumeTargetEpoch++;
    this.numPendingInvalidateCommands++;

    try {
      await callback();
    } finally {
      if (--this.numPendingInvalidateCommands == 0) {
        this.invalidateCommandWaiters.forEach(resolve => resolve());
        this.invalidateCommandWaiters.length = 0;
        this._precacheResumeTargets();
      }
    }
  },

  // Wait for any in flight invalidation commands to finish. Note: currently
  // this is only used during tests. Uses could be expanded to ensure that we
  // don't perform resumes until all invalidating commands have settled, though
  // this risks slowing things down and/or getting stuck if the server is having
  // a problem.
  waitForInvalidateCommandsToFinish() {
    if (!this.numPendingInvalidateCommands) {
      return;
    }
    const { promise, resolve } = defer();
    this.invalidateCommandWaiters.push(resolve);
    return promise;
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
    // Don't allow resumes until we've finished loading and did the initial
    // warp to the endpoint.
    await this.initializedWaiter.promise;

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
    resumeTarget = await this._findResumeTarget(point, command);
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

  async resumeTarget(point) {
    await this.initializedWaiter.promise;
    return this._findResumeTarget(point, "Debugger.findResumeTarget");
  },

  async blackbox(scriptId, begin, end) {
    this._invalidateResumeTargets(async () => {
      await sendMessage("Debugger.blackboxScript", { scriptId, begin, end }, this.sessionId);
    });
  },

  async unblackbox(scriptId, begin, end) {
    this._invalidateResumeTargets(async () => {
      await sendMessage("Debugger.unblackboxScript", { scriptId, begin, end }, this.sessionId);
    });
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
    const { scriptId } = this._chooseScriptId(locations.map(l => l.scriptId));
    return locations.find(l => l.scriptId == scriptId);
  },

  // Given an RRP MappedLocation array with locations in different scripts
  // representing the same generated location (i.e. a generated location plus
  // all the corresponding locations in original or pretty printed scripts etc.),
  // choose the location which we should be using within the devtools. Normally
  // this is the most original location, except when preferScript has been used
  // to prefer a generated script instead.
  async getPreferredLocation(locations) {
    await Promise.all(locations.map(({ scriptId }) => this.ensureScript(scriptId)));
    return this.getPreferredLocationRaw(locations);
  },

  async getAlternateLocation(locations) {
    await Promise.all(locations.map(({ scriptId }) => this.ensureScript(scriptId)));
    const { alternateId } = this._chooseScriptId(locations.map(l => l.scriptId));
    if (alternateId) {
      return locations.find(l => l.scriptId == alternateId);
    }
    return null;
  },

  // Get the script which should be used in the devtools from an array of
  // scripts representing the same location. If the chosen script is an
  // original or generated script and there is an alternative which users
  // can switch to, also returns that alternative.
  _chooseScriptId(scriptIds) {
    // Ignore inline scripts if we have an HTML script containing them.
    if (scriptIds.some(id => this.getScriptKind(id) == "html")) {
      scriptIds = scriptIds.filter(id => this.getScriptKind(id) != "inlineScript");
    }

    // Ignore minified scripts.
    scriptIds = scriptIds.filter(id => !this.isMinifiedScript(id));

    // Determine the base generated/original ID to use for the script.
    let generatedId, originalId;
    for (const id of scriptIds) {
      const info = this.scripts.get(id);
      if (!info) {
        // Scripts haven't finished loading, bail out and return this one.
        return { scriptId: id };
      }
      // Determine the kind of this script, or its minified version.
      let kind = info.kind;
      if (kind == "prettyPrinted") {
        const minifiedInfo = this.scripts.get(info.generatedScriptIds[0]);
        if (!minifiedInfo) {
          return { scriptId: id };
        }
        kind = minifiedInfo.kind;
        assert(kind != "prettyPrinted");
      }
      if (kind == "sourceMapped") {
        originalId = id;
      } else {
        assert(!generatedId);
        generatedId = id;
      }
    }

    if (!generatedId) {
      assert(originalId);
      return { scriptId: originalId };
    }

    if (!originalId) {
      return { scriptId: generatedId };
    }

    // Prefer original scripts over generated scripts, except when overridden
    // through user action.
    if (this.preferredGeneratedScripts.has(generatedId)) {
      return { scriptId: generatedId, alternateId: originalId };
    }
    return { scriptId: originalId, alternateId: generatedId };
  },

  // Get the set of chosen scripts from a list of script IDs which might
  // represent different generated locations.
  _chooseScriptIdList(scriptIds) {
    const groups = this._groupScriptIds(scriptIds);
    return groups.map(ids => this._chooseScriptId(ids));
  },

  // Group together a set of script IDs according to whether they are generated
  // or original versions of each other.
  _groupScriptIds(scriptIds) {
    const groups = [];
    while (scriptIds.length) {
      const id = scriptIds[0];
      const group = this._getAlternateScriptIds(id).filter(id => scriptIds.includes(id));
      groups.push(group);
      scriptIds = scriptIds.filter(id => !group.includes(id));
    }
    return groups;
  },

  // Get all original/generated IDs which can represent a location in scriptId.
  _getAlternateScriptIds(scriptId) {
    const rv = new Set();
    const worklist = [scriptId];
    while (worklist.length) {
      scriptId = worklist.pop();
      if (rv.has(scriptId)) {
        continue;
      }
      rv.add(scriptId);
      const { generatedScriptIds } = this.scripts.get(scriptId);
      (generatedScriptIds || []).forEach(id => worklist.push(id));
      const originalScriptIds = this.originalScripts.map.get(scriptId);
      (originalScriptIds || []).forEach(id => worklist.push(id));
    }
    return [...rv];
  },

  // Return whether scriptId is minified and has a pretty printed alternate.
  isMinifiedScript(scriptId) {
    const originalIds = this.originalScripts.map.get(scriptId) || [];
    return originalIds.some(id => {
      const info = this.scripts.get(id);
      return info && info.kind == "prettyPrinted";
    });
  },

  isSourceMappedScript(scriptId) {
    const info = this.scripts.get(scriptId);
    if (!info) {
      return false;
    }
    let kind = info.kind;
    if (kind == "prettyPrinted") {
      const minifiedInfo = this.scripts.get(info.generatedScriptIds[0]);
      if (!minifiedInfo) {
        return false;
      }
      kind = minifiedInfo.kind;
      assert(kind != "prettyPrinted");
    }
    return kind == "sourceMapped";
  },

  preferScript(scriptId, value) {
    assert(!this.isSourceMappedScript(scriptId));
    if (value) {
      this.preferredGeneratedScripts.add(scriptId);
    } else {
      this.preferredGeneratedScripts.delete(scriptId);
    }
  },

  hasPreferredGeneratedScript(location) {
    return location.some(({ scriptId }) => {
      return this.preferredGeneratedScripts.has(scriptId);
    });
  },

  // Given a location in a generated script, get the preferred location to use.
  // This has to query the server to get the original / pretty printed locations
  // corresponding to this generated location, so getPreferredLocation is
  // better to use when possible.
  async getPreferredMappedLocation(location) {
    const mappedLocation = await this.mappedLocations.getMappedLocation(location);
    return this.getPreferredLocation(mappedLocation);
  },

  async getRecordingDescription() {
    let description;
    try {
      description = await sendMessage("Recording.getDescription", {
        recordingId: this.recordingId,
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

  async watchMetadata(key, callback) {
    if (!this.metadataListeners) {
      addEventListener("Recording.metadataChange", ({ key, newValue }) => {
        this.metadataListeners.forEach(entry => {
          if (entry.key == key) {
            entry.callback(newValue ? JSON.parse(newValue) : undefined);
          }
        });
      });
      this.metadataListeners = [];
    }
    this.metadataListeners.push({ key, callback });

    const { value } = await sendMessage("Recording.metadataStartListening", {
      recordingId: this.recordingId,
      key,
    });
    callback(value ? JSON.parse(value) : undefined);
  },

  async updateMetadata(key, callback) {
    // Keep trying to update the metadata until it succeeds --- we updated it
    // before anyone else did. Use the callback to compute the new value in
    // terms of the old value. The callback can return null to cancel the update.
    let { value } = await sendMessage("Recording.getMetadata", {
      recordingId: this.recordingId,
      key,
    });
    while (true) {
      const newValueRaw = callback(value ? JSON.parse(value) : undefined);
      if (!newValueRaw) {
        // The update was cancelled.
        return;
      }
      const newValue = JSON.stringify(newValueRaw);
      const { updated, currentValue } = await sendMessage("Recording.setMetadata", {
        recordingId: this.recordingId,
        key,
        newValue,
        oldValue: value,
      });
      if (updated) {
        // It worked! Hooray!
        break;
      }
      // Retry with the value that was written by another client.
      value = currentValue;
    }
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
