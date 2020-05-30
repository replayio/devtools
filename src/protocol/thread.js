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

const {
  sendMessage,
  addEventListener,
} = require("./socket");
const {
  defer,
  assert,
  DisallowEverythingProxyHandler,
  EventEmitter,
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
    this.createWaiter =
      sendMessage("Session.createPause", { point }, this.sessionId).then(
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
          newBindings.push({ name: v.name, value: new ValueFront(this, v) });
        }
        scope.bindings = newBindings;
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
          newGetterValues.push({ name: v.name, value: new ValueFront(this, v) });
        }
        object.preview.getterValues = newGetterValues;
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
    return Promise.all(frame.scopeChain.map(async id => {
      if (!this.scopes.has(id)) {
        const { data } = await this.sendMessage("Pause.getScope", { scope: id });
        this.addData(data);
      }
      const scope = this.scopes.get(id);
      assert(scope);
      return scope;
    }));
  },

  sendMessage(method, params) {
    return sendMessage(method, params, this.sessionId, this.pauseId);
  },

  async getObjectPreview(object) {
    const { data } = await this.sendMessage("Pause.getObjectPreview", { object });
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

  getDOMFront(objectId) {
    // Make sure we don't create multiple node fronts for the same object.
    if (!objectId) {
      return null;
    }
    if (this.domFronts.has(objectId)) {
      return this.domFronts.get(objectId);
    }
    const data = this.objects.get(objectId);
    assert(data && data.preview && data.preview);
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

  async getFrameStepsAtIndex(index) {
    const frames = await this.getFrames();
    const { frameId } = frames[index];
    if (!this.frameSteps.has(frameId)) {
      const { steps } = await this.sendMessage("Pause.getFrameSteps", { frameId });
      this.frameSteps.set(frameId, steps);
    }
    return this.frameSteps.get(frameId);
  },
};

// Manages interaction with a value from a pause.
function ValueFront(pause, protocolValue, pseudoElements) {
  this._pause = pause;

  // For primitive values.
  this._hasPrimitive = false;
  this._primitive = undefined;

  // For objects.
  this._object = null;

  // For other kinds of values.
  this._uninitialized = false;
  this._unavailable = false;

  // For pseudo-values constructed by the devtools.
  this._pseudoElements = null;
  this._isMapEntry = null;

  if (pseudoElements) {
    this._pseudoElements = pseudoElements;
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
    if (this._pseudoElements) {
      return "pseudoElements";
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
    return this._object.preview.functionLocation;
  },

  functionLocationURL() {
    const location = this.functionLocation();
    if (location) {
      return ThreadFront.getScriptURL(location.scriptId);
    }
  },

  isString() {
    return this.isPrimitive() && typeof (this.primitive()) == "string";
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

  isScope() {
    return false;
  },

  hasChildren() {
    return false;
    //return this.isObject();
  },

  getChildren() {
    if (this._pseudoElements) {
      return this._pseudoElements;
    }
    if (this.hasPreviewOverflow()) {
      // See ObjectInspectorItem.js
      return [{
        name: "Loading…",
        contents: createUnavailableValueFront(),
      }];
    }
    const previewValues = this.previewValueMap();
    const rv = Object.entries(previewValues).map(
      ([name, contents]) => ({ name, contents })
    );
    if (["Set", "WeakSet", "Map", "WeakMap"].includes(this.className())) {
      const elements = this.previewContainerEntries().map(({ key, value }, i) => {
        if (key) {
          const entryElements = [
            { name: "<key>", contents: key },
            { name: "<value>", contents: value },
          ];
          const entry = createPseudoValueFront(entryElements);
          entry._isMapEntry = { key, value };
          return { name: i.toString(), contents: entry };
        } else {
          return { name: i.toString(), contents: value };
        }
      });
      rv.unshift({ name: "<entries>", contents: createPseudoValueFront(elements) });
    }
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
        promises.push(this.getPause().getObjectPreview(contents._object.objectId));
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

function createPseudoValueFront(elements) {
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
    const { result, data } = await this._pause.sendMessage(
      "DOM.querySelector",
      { node: this._object.objectId, selector }
    );
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
      this._pause.sendMessage(
        "CSS.getComputedStyle",
        { node: this._object.objectId }
      ).then(({ computedStyle }) => {
        this._computedStyle = new Map();
        for (const { name, value } of computedStyle) {
          this._computedStyle.set(name, value);
        }
      }),
      this._pause.sendMessage(
        "CSS.getAppliedRules",
        { node: this._object.objectId }
      ).then(({ rules, data }) => {
        this._rules = rules;
        this._pause.addData(data);
      }),
      this._pause.sendMessage(
        "DOM.getEventListeners",
        { node: this._object.objectId }
      ).then(({ listeners, data }) => {
        this._pause.addData(data);
        this._listeners = listeners.map(listener => ({
          ...listener,
          handler: new ValueFront(this._pause, { object: listener.handler }),
          node: this._pause.getDOMFront(listener.node),
        }));
      }),
      this._pause.sendMessage(
        "DOM.getBoxModel",
        { node: this._object.objectId }
      ).then(({ model }) => {
        this._quads = model;
      }),
      this._pause.sendMessage(
        "DOM.getBoundingClientRect",
        { node: this._object.objectId }
      ).then(({ rect }) => {
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
  const rv = [];
  while (array.length) {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = array.splice(0, 8);
    rv.push(DOMQuad.fromQuad({
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 },
      p3: { x: x3, y: y3 },
      p4: { x: x4, y: y4 },
    }));
  }
  return rv;
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

  get style() {
    return this;
  },
};

Object.setPrototypeOf(StyleFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

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

  sessionId: null,
  sessionWaiter: defer(),

  // Map scriptId to URL.
  scriptURLs: new Map(),

  // Map URL to scriptId[].
  urlScripts: new Map(),

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

    console.log(`GotSessionId ${sessionId}`);

    const { endpoint } = await sendMessage("Session.getEndpoint", {}, sessionId);
    if (this.onEndpoint) {
      this.onEndpoint(endpoint);
    }
    this.timeWarp(endpoint.point, endpoint.time);
  },

  setTest(test) {
    this.testName = test;
  },

  async ensureProcessed(onMissingRegions, onUnprocessedRegions) {
    const sessionId = await this.sessionWaiter.promise;

    addEventListener("Session.missingRegions", onMissingRegions);
    addEventListener("Session.unprocessedRegions", onUnprocessedRegions);

    await sendMessage("Session.ensureProcessed", {}, sessionId);
    if (this.testName) {
      const script = document.createElement("script");
      script.src = `/test?${this.testName}`;
      document.head.appendChild(script);
    }
  },

  async downloadResources(recordingId) {
    // For now, we have to download source maps in order to use them in the debugger.
    const { resources } = await sendMessage(
      "Internal.listRecordingResources",
      { recordingId }
    );
    for (const resource of resources) {
      sendMessage("Internal.getRecordingResource", { recordingId, resource }).then(
        ({ contents }) => {
          gToolbox.sourceMapService.addResource(resource.url, contents);
        }
      );
    }
  },

  timeWarp(point, time, hasFrames) {
    console.log(`TimeWarp ${point}`);
    this.currentPoint = point;
    this.currentPointHasFrames = hasFrames;
    this.currentPause = null;
    this.emit("paused", { point, time });

    this._precacheResumeTargets();
  },

  async findScripts(onScript) {
    const sessionId = await this.sessionWaiter.promise;

    sendMessage("Debugger.findScripts", {}, sessionId);
    addEventListener("Debugger.scriptParsed", script => {
      const { scriptId, url } = script;
      if (url) {
        this.scriptURLs.set(scriptId, url);
        if (this.urlScripts.has(url)) {
          this.urlScripts.get(url).push(scriptId);
        } else {
          this.urlScripts.set(url, [scriptId]);
        }
      }
      onScript(script);
    });
  },

  getScriptURL(scriptId) {
    return this.scriptURLs.get(scriptId);
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
    const scriptIds = this.urlScripts.get(url);
    return Promise.all((scriptIds || []).map(scriptId => {
      return this.setBreakpoint(scriptId, line, column, condition);
    }));
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
    return Promise.all(this.urlScripts.get(url)?.map(scriptId => {
      return this.removeBreakpoint(scriptId, line, column);
    }) || []);
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

  getScopes(frameId) {
    return this.currentPause.getScopes(frameId);
  },

  async evaluate(frameId, text) {
    this.ensureCurrentPause();
    const rv = await this.currentPause.evaluate(frameId, text);
    if (rv.returned) {
      rv.returned = new ValueFront(this.currentPause, rv.returned);
    } else if (rv.exception) {
      rv.exception = new ValueFront(this.currentPause, rv.exception);
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
        transitive: [ "Debugger.findReverseStepOverTarget", "Debugger.findStepInTarget" ],
      },
      {
        command: "Debugger.findStepOverTarget",
        transitive: [ "Debugger.findStepOverTarget", "Debugger.findStepInTarget" ],
      },
      {
        command: "Debugger.findStepInTarget",
        transitive: [ "Debugger.findStepOutTarget", "Debugger.findStepInTarget" ],
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
        if (epoch != this.resumeTargetEpoch ||
            point != this.currentPoint ||
            !transitiveTarget.frame) {
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

  async _resumeOperation(command) {
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
    const target = await this._findResumeTarget(this.currentPoint, command);
    resumeTarget = target;
    if (resumeEmitted) {
      warpToTarget();
    }
  },

  rewind() { this._resumeOperation("Debugger.findRewindTarget"); },
  resume() { this._resumeOperation("Debugger.findResumeTarget"); },
  reverseStepOver() { this._resumeOperation("Debugger.findReverseStepOverTarget"); },
  stepOver() { this._resumeOperation("Debugger.findStepOverTarget"); },
  stepIn() { this._resumeOperation("Debugger.findStepInTarget"); },
  stepOut() { this._resumeOperation("Debugger.findStepOutTarget"); },

  async blackbox(scriptId, begin, end) {
    await sendMessage(
      "Debugger.blackboxScript",
      { scriptId, begin, end },
      this.sessionId
    );
    this._invalidateResumeTargets();
  },

  async unblackbox(scriptId, begin, end) {
    await sendMessage(
      "Debugger.unblackboxScript",
      { scriptId, begin, end },
      this.sessionId
    );
    this._invalidateResumeTargets();
  },

  async findConsoleMessages(onConsoleMessage) {
    const sessionId = await this.sessionWaiter.promise;

    sendMessage("Console.findMessages", {}, sessionId);
    addEventListener("Console.newMessage", ({ message }) => {
      const pause = new Pause(this.sessionId);
      pause.instantiate(message.pauseId, message.data);
      if (message.argumentValues) {
        message.argumentValues = message.argumentValues.map(
          v => new ValueFront(pause, v)
        );
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

  getFrameStepsAtIndex(index) {
    return this.currentPause.getFrameStepsAtIndex(index);
  },
};

EventEmitter.decorate(ThreadFront);

module.exports = {
  ThreadFront,
  ValueFront,
  Pause,
  createPrimitiveValueFront,
  createUnavailableValueFront,
};
