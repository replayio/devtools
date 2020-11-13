const { client } = require("../socket");
const { defer, assert } = require("../utils");
const { ValueFront } = require("./value");
import { ThreadFront } from "./thread";
const { NodeFront } = require("./node");
const { RuleFront } = require("./rule");
const { StyleFront } = require("./style");
const { StyleSheetFront } = require("./styleSheet");
const { NodeBoundsFront } = require("./bounds");

const pausesById = new Map();

// Information about a protocol pause.
export function Pause(sessionId) {
  this.sessionId = sessionId;
  this.pauseId = null;
  this.point = null;
  this.time = null;
  this.hasFrames = null;

  this.createWaiter = null;

  this.frames = new Map();
  this.scopes = new Map();
  this.objects = new Map();

  this.frameSteps = new Map();

  this.documentNode = undefined;
  this.domFronts = new Map();
}

Pause.getById = pauseId => {
  return pausesById.get(pauseId);
};

Pause.prototype = {
  create(point, time) {
    assert(!this.createWaiter);
    assert(!this.pauseId);
    this.createWaiter = client.Session.createPause({ point }, this.sessionId).then(
      ({ pauseId, stack, data }) => {
        this.pauseId = pauseId;
        this.point = point;
        this.time = time;
        this.hasFrames = !!stack;
        this.addData(data);
        if (stack) {
          this.stack = stack.map(id => this.frames.get(id));
        }
        pausesById.set(pauseId, this);
      }
    );
  },

  instantiate(pauseId, point, time, hasFrames, data = {}) {
    assert(!this.createWaiter);
    assert(!this.pauseId);
    this.createWaiter = Promise.resolve();
    this.pauseId = pauseId;
    this.point = point;
    this.time = time;
    this.hasFrames = hasFrames;
    this.addData(data);
    pausesById.set(pauseId, this);
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

    if (this.hasFrames && !this.stack) {
      const { frames, data } = await client.Pause.getAllFrames({}, this.sessionId, this.pauseId);
      this.addData(data);
      this.stack = frames.map(id => this.frames.get(id));
    }

    return this.stack;
  },

  ensureScopeChain(scopeChain) {
    return Promise.all(
      scopeChain.map(async id => {
        if (!this.scopes.has(id)) {
          const { data } = await this.sendMessage(client.Pause.getScope, {
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
    // but when a generated source is marked as preferred we use the generated
    // scope chain instead. In the original case we still load the frame's
    // normal scope chain first, as currently the backend does not supply
    // related objects when loading original scopes and we don't deal with that
    // properly.
    let scopeChain = await this.ensureScopeChain(frame.scopeChain);
    if (frame.originalScopeChain && !ThreadFront.hasPreferredGeneratedSource(frame.location)) {
      scopeChain = await this.ensureScopeChain(frame.originalScopeChain);
    }

    return scopeChain;
  },

  sendMessage(method, params) {
    return method(params, this.sessionId, this.pauseId);
  },

  async getObjectPreview(object) {
    const { data } = await this.sendMessage(client.Pause.getObjectPreview, {
      object,
    });
    this.addData(data);
    return this.objects.get(object);
  },

  async evaluate(frameId, expression) {
    assert(this.createWaiter);
    await this.createWaiter;
    const { result } = frameId
      ? await this.sendMessage(client.Pause.evaluateInFrame, {
          frameId,
          expression,
          useOriginalScopes: true,
        })
      : await this.sendMessage(client.Pause.evaluateInGlobal, { expression });
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

  getNodeFront(objectId) {
    const front = this.getDOMFront(objectId);
    assert(front instanceof NodeFront);
    return front;
  },

  getRuleFront(objectId) {
    const front = this.getDOMFront(objectId);
    assert(front instanceof RuleFront);
    return front;
  },

  getStyleFront(objectId) {
    const front = this.getDOMFront(objectId);
    assert(front instanceof StyleFront);
    return front;
  },

  getStyleSheetFront(objectId) {
    const front = this.getDOMFront(objectId);
    assert(front instanceof StyleSheetFront);
    return front;
  },

  // Asynchronously get a DOM front for an object which might not have a preview.
  async ensureDOMFrontAndParents(nodeId) {
    let parentId = nodeId;
    while (parentId) {
      const data = this.objects.get(parentId);
      if (!data || !data.preview) {
        const { data } = await this.sendMessage(client.DOM.getParentNodes, { node: parentId });
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
    const { document, data } = await this.sendMessage(client.DOM.getDocument);
    this.addData(data);
    this.documentNode = this.getDOMFront(document);
  },

  async searchDOM(query) {
    const { nodes, data } = await this.sendMessage(client.DOM.performSearch, { query });
    this.addData(data);
    return nodes.map(node => this.getDOMFront(node));
  },

  async loadMouseTargets() {
    if (this.loadMouseTargetsWaiter) {
      return this.loadMouseTargetsWaiter.promise;
    }
    this.loadMouseTargetsWaiter = defer();
    const { elements } = await this.sendMessage(client.DOM.getAllBoundingClientRects);
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
      const { steps } = await this.sendMessage(client.Pause.getFrameSteps, {
        frameId,
      });
      this.frameSteps.set(frameId, steps);
    }
    return this.frameSteps.get(frameId);
  },
};
