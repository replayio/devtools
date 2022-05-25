import {
  ExecutionPoint,
  Frame,
  FrameId,
  ObjectId,
  Object as ObjectDescription,
  PauseId,
  Scope,
  ScopeId,
  SessionId,
  ObjectPreview,
  PointDescription,
  NodeBounds,
  PauseData,
  repaintGraphicsResult,
  getAllBoundingClientRectsResult,
} from "@replayio/protocol";

import { client } from "../socket";
import { defer, assert, Deferred } from "../utils";

import { NodeBoundsFront } from "./bounds";
import { NodeFront } from "./node";
import { RuleFront } from "./rule";
import { StyleFront } from "./style";
import { StyleSheetFront } from "./styleSheet";
import type { ThreadFront as ThreadFrontType } from "./thread";
import { ValueFront } from "./value";

const pausesById = new Map<PauseId, Pause>();

export type DOMFront = NodeFront | RuleFront | StyleFront | StyleSheetFront;

export type WiredObject = Omit<ObjectDescription, "preview"> & {
  preview?: WiredObjectPreview;
};

export type WiredObjectPreview = Omit<
  ObjectPreview,
  "properties" | "containerEntries" | "promiseState" | "proxyState" | "getterValues"
> & {
  properties: WiredProperty[];
  containerEntries: WiredContainerEntry[];
  promiseState?: {
    state: ValueFront;
    value?: ValueFront;
  };
  proxyState?: {
    target: ValueFront;
    handler: ValueFront;
  };
  getterValues: WiredNamedValue[];
  prototypeValue: ValueFront;
};

export interface WiredContainerEntry {
  key?: ValueFront;
  value: ValueFront;
}

export interface WiredProperty {
  name: string;
  value: ValueFront;
  writable: boolean;
  configurable: boolean;
  enumerable: boolean;
  get?: ValueFront;
  set?: ValueFront;
}

export interface WiredNamedValue {
  name: string;
  value: ValueFront;
}

export type WiredFrame = Omit<Frame, "this"> & {
  this: ValueFront;
};

export type WiredScope = Omit<Scope, "bindings" | "object"> & {
  bindings?: WiredNamedValue[];
  object?: ValueFront;
};

export interface EvaluationResult {
  returned?: ValueFront;
  exception?: ValueFront;
  failed?: boolean;
}

// Information about a protocol pause.
export class Pause {
  ThreadFront: typeof ThreadFrontType;
  sessionId: SessionId;
  pauseId: PauseId | null;
  pauseIdWaiter: Deferred<PauseId>;
  point: ExecutionPoint | null;
  time: number | null;
  hasFrames: boolean | null;
  createWaiter: Promise<void> | null;
  frames: Map<FrameId, WiredFrame>;
  scopes: Map<ScopeId, WiredScope>;
  objects: Map<ObjectId, WiredObject>;
  frameSteps: Map<string, PointDescription[]>;
  documentNode: NodeFront | undefined;
  domFronts: Map<string, DOMFront>;
  stack: WiredFrame[] | undefined;
  loadMouseTargetsWaiter: Deferred<getAllBoundingClientRectsResult | null> | undefined;
  repaintGraphicsWaiter: Deferred<repaintGraphicsResult | null> | undefined;
  mouseTargets: NodeBounds[] | undefined;

  constructor(ThreadFront: typeof ThreadFrontType) {
    this.ThreadFront = ThreadFront;
    this.sessionId = ThreadFront.sessionId!;
    this.pauseId = null;
    this.pauseIdWaiter = defer();
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

  static getById(pauseId: PauseId) {
    return pausesById.get(pauseId);
  }

  private _setPauseId(pauseId: PauseId) {
    this.pauseId = pauseId;
    this.pauseIdWaiter.resolve(pauseId);
  }

  create(point: ExecutionPoint, time: number) {
    assert(!this.createWaiter, "createWaiter already set");
    assert(!this.pauseId, "pauseId already set");
    this.createWaiter = client.Session.createPause({ point }, this.sessionId).then(
      ({ pauseId, stack, data }) => {
        this._setPauseId(pauseId);
        this.point = point;
        this.time = time;
        this.hasFrames = !!stack && stack.length > 0;
        this.addData(data);
        if (stack) {
          this.stack = stack.map(id => this.frames.get(id)!);
        }
        pausesById.set(pauseId, this);
      }
    );
  }

  instantiate(
    pauseId: PauseId,
    point: ExecutionPoint,
    time: number,
    hasFrames: boolean,
    data: PauseData = {}
  ) {
    assert(!this.createWaiter, "createWaiter already set");
    assert(!this.pauseId, "pauseId already set");
    this.createWaiter = Promise.resolve();
    this._setPauseId(pauseId);
    this.point = point;
    this.time = time;
    this.hasFrames = hasFrames;
    this.addData(data);
    pausesById.set(pauseId, this);
  }

  addData(...datas: PauseData[]) {
    datas.forEach(d => this._addDataObjects(d));
    datas.forEach(d => this._updateDataFronts(d));
  }

  // we're cheating Typescript here: the objects that we add are of type Frame/Scope/ObjectDescription
  // but we pretend they are of type WiredFrame/WiredScope/WiredObject. These objects will be changed
  // in _updateDataFronts() so that they have the correct type afterwards.
  // This cheat is necessary because Typescript doesn't support objects changing their types over time.
  private _addDataObjects({ frames, scopes, objects }: PauseData) {
    (frames || []).forEach(f => {
      if (!this.frames.has(f.frameId)) {
        this.frames.set(f.frameId, f as WiredFrame);
      }
    });
    (scopes || []).forEach(s => {
      if (!this.scopes.has(s.scopeId)) {
        this.scopes.set(s.scopeId, s as WiredScope);
      }
    });
    (objects || []).forEach(o => {
      if (!this.objects.has(o.objectId)) {
        this.objects.set(o.objectId, o as WiredObject);
      }
    });
  }

  private _updateDataFronts({ frames, scopes, objects }: PauseData) {
    (frames || []).forEach(frame => {
      (frame as WiredFrame).this = new ValueFront(this, frame.this);
      this.ThreadFront.updateMappedLocation(frame.location);
      this.ThreadFront.updateMappedLocation(frame.functionLocation);
    });

    (scopes || []).forEach(scope => {
      if (scope.bindings) {
        const newBindings: WiredNamedValue[] = [];
        for (const v of scope.bindings) {
          newBindings.push({
            name: v.name,
            value: new ValueFront(this, v),
          });
        }
        scope.bindings = newBindings;
      }
      if (scope.object) {
        (scope as WiredScope).object = new ValueFront(this, { object: scope.object });
      }
    });

    (objects || []).forEach(object => {
      if (object.preview) {
        const { properties, containerEntries, promiseState, proxyState, getterValues } =
          object.preview;

        const newProperties = [];
        for (const p of properties || []) {
          const flags = "flags" in p ? p.flags! : 7;
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
        (object as WiredObject).preview!.properties = newProperties;

        const newEntries = [];
        for (const { key, value } of containerEntries || []) {
          newEntries.push({
            key: key ? new ValueFront(this, key) : undefined,
            value: new ValueFront(this, value),
          });
        }
        (object as WiredObject).preview!.containerEntries = newEntries;

        if (promiseState) {
          const { state, value } = promiseState;

          (object as WiredObject).preview!.promiseState = {
            state: new ValueFront(this, { value: state }),
            value: value ? new ValueFront(this, value) : undefined,
          };
        }
        if (proxyState) {
          const { target, handler } = proxyState;

          (object as WiredObject).preview!.proxyState = {
            target: new ValueFront(this, target),
            handler: new ValueFront(this, handler),
          };
        }

        const newGetterValues: WiredNamedValue[] = [];
        for (const v of getterValues || []) {
          newGetterValues.push({
            name: v.name,
            value: new ValueFront(this, v),
          });
        }
        object.preview.getterValues = newGetterValues;

        const { prototypeId } = object.preview;
        (object.preview as WiredObjectPreview).prototypeValue = new ValueFront(
          this,
          prototypeId ? { object: prototypeId } : { value: null }
        );

        this.ThreadFront.updateMappedLocation(object.preview.functionLocation);
      }

      this.objects.get(object.objectId)!.preview = object.preview as WiredObjectPreview;
    });
  }

  async getFrames() {
    assert(this.createWaiter, "no createWaiter");
    await this.createWaiter;

    if (this.hasFrames && !this.stack) {
      const { frames, data } = await client.Pause.getAllFrames({}, this.sessionId, this.pauseId!);
      this.addData(data);
      this.stack = frames.map(id => this.frames.get(id)!);
    }

    return this.stack;
  }

  ensureScopeChain(scopeChain: ScopeId[]) {
    return Promise.all(
      scopeChain.map(async id => {
        if (!this.scopes.has(id)) {
          const { data } = await this.sendMessage(client.Pause.getScope, {
            scope: id,
          });
          this.addData(data);
        }
        const scope = this.scopes.get(id);
        assert(scope, "scope not found");
        return scope;
      })
    );
  }

  async getScopes(frameId: FrameId) {
    const frame = this.frames.get(frameId);
    assert(frame, "frame not found");

    // Normally we use the original scope chain for the frame if there is one,
    // but when a generated source is marked as preferred we use the generated
    // scope chain instead. In the original case we still load the frame's
    // normal scope chain first, as currently the backend does not supply
    // related objects when loading original scopes and we don't deal with that
    // properly.
    let scopeChain = await this.ensureScopeChain(frame.scopeChain);
    let originalScopesUnavailable = false;
    if (frame.originalScopeChain && !this.ThreadFront.hasPreferredGeneratedSource(frame.location)) {
      const originalScopeChain = await this.ensureScopeChain(frame.originalScopeChain);

      // if all original variables are unavailable (usually due to sourcemap issues),
      // we show the generated scope chain with a warning message instead
      originalScopesUnavailable = originalScopeChain.every(scope =>
        (scope.bindings || []).every(binding => binding.value.isUnavailable())
      );
      if (!originalScopesUnavailable) {
        scopeChain = originalScopeChain;
      }
    }

    return { scopes: scopeChain, originalScopesUnavailable };
  }

  sendMessage<P, R>(
    method: (parameters: P, sessionId?: SessionId, pauseId?: PauseId) => R,
    params: P
  ) {
    assert(this.pauseId, "pauseId not set before sending a message");
    return method(params, this.sessionId, this.pauseId);
  }

  async getObjectPreview(object: ObjectId) {
    const { data } = await this.sendMessage(client.Pause.getObjectPreview, {
      object,
    });
    this.addData(data);
    return this.objects.get(object)!;
  }

  async getObjectProperty(object: ObjectId, property: string) {
    const { result } = await this.sendMessage(client.Pause.getObjectProperty, {
      object,
      name: property,
    });
    const { returned, exception, failed, data } = result;
    this.addData(data);
    return {
      returned: returned ? new ValueFront(this, returned) : undefined,
      exception: exception ? new ValueFront(this, exception) : undefined,
      failed,
    };
  }

  async evaluate(frameId: FrameId | undefined, expression: string, pure: boolean) {
    assert(this.createWaiter, "no createWaiter");
    await this.createWaiter;
    const { result } = frameId
      ? await this.sendMessage(client.Pause.evaluateInFrame, {
          frameId,
          expression,
          useOriginalScopes: true,
          pure,
        })
      : await this.sendMessage(client.Pause.evaluateInGlobal, { expression, pure });
    const { returned, exception, failed, data } = result;
    this.addData(data);
    return { returned, exception, failed } as EvaluationResult;
  }

  // Synchronously get a DOM front for an object whose preview is known.
  getDOMFront(objectId: ObjectId): NodeFront | RuleFront | StyleFront | StyleSheetFront | null {
    // Make sure we don't create multiple node fronts for the same object.
    if (!objectId) {
      return null;
    }
    if (this.domFronts.has(objectId)) {
      return this.domFronts.get(objectId)!;
    }
    const data = this.objects.get(objectId);
    assert(data && data.preview, "no preview");
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
  }

  getNodeFront(objectId: ObjectId) {
    const front = this.getDOMFront(objectId);
    assert(front instanceof NodeFront, "front must be a NodeFront");
    return front;
  }

  getRuleFront(objectId: ObjectId) {
    const front = this.getDOMFront(objectId);
    assert(front instanceof RuleFront, "front must be a RuleFront");
    return front;
  }

  getStyleFront(objectId: ObjectId) {
    const front = this.getDOMFront(objectId);
    assert(front instanceof StyleFront, "front must be a StyleFront");
    return front;
  }

  getStyleSheetFront(objectId: ObjectId) {
    const front = this.getDOMFront(objectId);
    assert(front instanceof StyleSheetFront, "front must be a StyleSheetFront");
    return front;
  }

  // Asynchronously get a DOM front for an object which might not have a preview.
  async ensureDOMFrontAndParents(nodeId: ObjectId) {
    let parentId: ObjectId | undefined = nodeId;
    while (parentId) {
      const data = this.objects.get(parentId);
      if (!data || !data.preview) {
        const { data } = await this.sendMessage(client.DOM.getParentNodes, { node: parentId });
        this.addData(data);
        break;
      }
      assert(data.preview.node, "no node preview");
      parentId = data.preview.node.parentNode;
    }
    return this.getNodeFront(nodeId)!;
  }

  async loadDocument() {
    if (this.documentNode) {
      return;
    }
    assert(this.createWaiter, "no createWaiter");
    await this.createWaiter;
    const { document, data } = await this.sendMessage(client.DOM.getDocument, {});
    this.addData(data);
    this.documentNode = this.getNodeFront(document);
  }

  async searchDOM(query: string) {
    const { nodes, data } = await this.sendMessage(client.DOM.performSearch, { query });
    this.addData(data);
    return nodes.map(node => this.getNodeFront(node));
  }

  async loadMouseTargets() {
    if (this.loadMouseTargetsWaiter) {
      return this.loadMouseTargetsWaiter.promise;
    }

    this.loadMouseTargetsWaiter = defer();
    let rv = null;
    try {
      rv = await this.sendMessage(client.DOM.getAllBoundingClientRects, {});
      this.mouseTargets = rv.elements;
    } catch (e) {
      this.mouseTargets = [];
      console.error("DOM.getAllBoundingClientRects failed", e);
    }

    this.loadMouseTargetsWaiter.resolve(rv);
    return !!rv;
  }

  async getMouseTarget(x: number, y: number, nodeIds?: string[]) {
    await this.loadMouseTargets();
    for (let { node, rect, rects, clipBounds, visibility, pointerEvents } of this.mouseTargets!) {
      if (nodeIds && !nodeIds.includes(node)) {
        continue;
      }
      if (visibility === "hidden" || pointerEvents === "none") {
        continue;
      }
      if (
        (clipBounds?.left !== undefined && x < clipBounds.left) ||
        (clipBounds?.right !== undefined && x > clipBounds.right) ||
        (clipBounds?.top !== undefined && y < clipBounds.top) ||
        (clipBounds?.bottom !== undefined && y > clipBounds.bottom)
      ) {
        continue;
      }

      // in the protocol, rects is set to undefined if there is only one rect
      rects ||= [rect];
      for (const r of rects) {
        const [left, top, right, bottom] = r;
        if (x >= left && x <= right && y >= top && y <= bottom) {
          return new NodeBoundsFront(this, node, rects);
        }
      }
    }
    return null;
  }

  async repaintGraphics(force = false) {
    if (this.repaintGraphicsWaiter && !force) {
      return this.repaintGraphicsWaiter.promise;
    }
    this.repaintGraphicsWaiter = defer();
    let rv = null;
    try {
      await this.pauseIdWaiter.promise;
      rv = await this.sendMessage(client.DOM.repaintGraphics, {});
    } catch (e) {
      console.error("DOM.repaintGraphics failed", e);
    }
    this.repaintGraphicsWaiter.resolve(rv);
    return rv;
  }

  async getFrameSteps(frameId: FrameId) {
    if (!this.frameSteps.has(frameId)) {
      const { steps } = await this.sendMessage(client.Pause.getFrameSteps, {
        frameId,
      });
      for (const step of steps) {
        this.ThreadFront.updateMappedLocation(step.frame);
      }
      this.frameSteps.set(frameId, steps);
    }
    return this.frameSteps.get(frameId)!;
  }
}
