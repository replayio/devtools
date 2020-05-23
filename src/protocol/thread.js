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
  DisallowEverythingProxyHandler
} = require("./utils");

// Information about a protocol pause.
function Pause(sessionId) {
  this.sessionId = sessionId;
  this.pauseID = null;

  this.createWaiter = null;

  this.frames = new Map();
  this.scopes = new Map();
  this.objects = new Map();
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
          this.stack = stack.map(id => this.frames.get(id));
        }
      );
  },

  instantiate(pauseId, data) {
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
            writable: flags & 1,
            configurable: flags & 2,
            enumerable: flags & 4,
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
    return frame.scopeChain.map(id => this.scopes.get(id));
  },

  async evaluateInFrame(frameId, expression) {
    const { result } = await sendMessage(
      "Pause.evaluateInFrame",
      { frameId, expression },
      this.sessionId,
      this.pauseId
    );
    const { returned, exception, failed, data } = result;
    this.addData(data);
    return { returned, exception, failed };
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
      return this._object.objectId;
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
    return this.isPrimitive() && typeof(this.primitive()) == "string";
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
        contents: new ValueFront(null, { unavailable: true }),
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
    if (this.isObject() && this.hasPreviewOverflow()) {
      const { data } = await sendMessage(
        "Pause.getObjectPreview",
        { object: this._object.objectId },
        this.getPause().sessionId,
        this.getPause().pauseId
      );
      this.getPause().addData(data);
      assert(!this.hasPreviewOverflow());
    }
    return this.getChildren();
  },
};

Object.setPrototypeOf(ValueFront.prototype, new Proxy({}, DisallowEverythingProxyHandler));

function createPrimitiveValueFront(value) {
  return new ValueFront(null, { value });
}

function createPseudoValueFront(elements) {
  return new ValueFront(null, undefined, elements);
}

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

  eventListeners: new Map(),

  on(name, handler) {
    if (this.eventListeners.has(name)) {
      this.eventListeners.get(name).push(handler);
    } else {
      this.eventListeners.set(name, [handler]);
    }
  },

  emit(name, value) {
    (this.eventListeners.get(name) || []).forEach(handler => handler(value));
  },

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

  timeWarp(point, time, hasFrames) {
    this.currentPoint = point;
    this.currentPointHasFrames = hasFrames;
    this.currentPause = null;
    this.emit("paused", { point, time });
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
      }
    }
  },

  removeBreakpointByURL(url, line, column) {
    return Promise.all(this.urlScripts.get(url).map(scriptId => {
      return this.removeBreakpoint(scriptId, line, column);
    }));
  },

  ensurePause() {
    if (!this.currentPause) {
      this.currentPause = new Pause(this.sessionId);
      this.currentPause.create(this.currentPoint);
    }
  },

  getFrames() {
    if (!this.currentPointHasFrames) {
      return [];
    }

    this.ensurePause();
    return this.currentPause.getFrames();
  },

  getScopes(frameId) {
    return this.currentPause.getScopes(frameId);
  },

  async evaluateInFrame(frameId, text) {
    const rv = await this.currentPause.evaluateInFrame(frameId, text);
    if (rv.returned) {
      rv.returned = new ValueFront(this.currentPause, rv.returned);
    } else if (rv.exception) {
      rv.exception = new ValueFront(this.currentPause, rv.exception);
    }
    return rv;
  },

  _resumeOperation(command) {
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
    sendMessage(
      command,
      { point: this.currentPoint },
      this.sessionId
    ).then(({ target }) => {
      resumeTarget = target;
      if (resumeEmitted) {
        warpToTarget();
      }
    });
  },

  rewind() { this._resumeOperation("Debugger.findRewindTarget"); },
  resume() { this._resumeOperation("Debugger.findResumeTarget"); },
  reverseStepOver() { this._resumeOperation("Debugger.findReverseStepOverTarget"); },
  stepOver() { this._resumeOperation("Debugger.findStepOverTarget"); },
  stepIn() { this._resumeOperation("Debugger.findStepInTarget"); },
  stepOut() { this._resumeOperation("Debugger.findStepOutTarget"); },

  blackbox(scriptId, begin, end) {
    return sendMessage(
      "Debugger.blackboxScript",
      { scriptId, begin, end },
      this.sessionId
    );
  },

  unblackbox(scriptId, begin, end) {
    return sendMessage(
      "Debugger.unblackboxScript",
      { scriptId, begin, end },
      this.sessionId
    );
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
};

module.exports = {
  ThreadFront,
  ValueFront,
  createPrimitiveValueFront,
};
