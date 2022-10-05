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
} from "@replayio/protocol";

import cloneDeep from "lodash/cloneDeep";

import { client } from "../socket";
import { defer, assert, Deferred, EventEmitter } from "../utils";

import type { ThreadFront as ThreadFrontType } from "./thread";
import { ValueFront } from "./value";

const pausesById = new Map<PauseId, Pause>();
const pausesByPoint = new Map<ExecutionPoint, Pause>();

// Allow the new Object Inspector's Suspense cache to observe Pause data and pre-cache it.
type PauseDataHandler = (
  pauseId: PauseId,
  executionPoint: ExecutionPoint,
  pauseData: PauseData
) => void;
const pauseDataHandlers: PauseDataHandler[] = [];
export function addPauseDataListener(handler: PauseDataHandler): void {
  pauseDataHandlers.push(handler);
}
export function removePauseDataListener(handler: PauseDataHandler): void {
  const index = pauseDataHandlers.indexOf(handler);
  if (index !== -1) {
    pauseDataHandlers.splice(index, 1);
  }
}

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

type PauseEvent = "objects";

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
  rawFrames: Map<FrameId, Frame>;
  rawScopes: Map<ScopeId, Scope>;
  frameSteps: Map<string, PointDescription[]>;
  stack: WiredFrame[] | undefined;
  repaintGraphicsWaiter: Deferred<repaintGraphicsResult | null> | undefined;
  mouseTargets: NodeBounds[] | undefined;

  // added by EventEmitter.decorate(ThreadFront)
  eventListeners!: Map<PauseEvent, ((value?: any) => void)[]>;
  on!: (name: PauseEvent, handler: (value?: any) => void) => void;
  off!: (name: PauseEvent, handler: (value?: any) => void) => void;
  emit!: (name: PauseEvent, value?: any) => void;

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
    this.rawFrames = new Map();
    this.rawScopes = new Map();

    this.frameSteps = new Map();

    EventEmitter.decorate<any, PauseEvent>(this);
  }

  static getById(pauseId: PauseId): Pause | null {
    return pausesById.get(pauseId) || null;
  }

  static getByPoint(point: ExecutionPoint): Pause | null {
    return pausesByPoint.get(point) || null;
  }

  private _setPauseId(pauseId: PauseId) {
    this.pauseId = pauseId;
    this.pauseIdWaiter.resolve(pauseId);
  }

  create(point: ExecutionPoint, time: number) {
    assert(!this.createWaiter, "createWaiter already set");
    assert(!this.pauseId, "pauseId already set");

    pausesByPoint.set(point, this);

    this.createWaiter = (async () => {
      const { pauseId, stack, data } = await client.Session.createPause({ point }, this.sessionId);
      await this.ThreadFront.ensureAllSources();
      this._setPauseId(pauseId);
      this.point = point;
      this.time = time;
      this.hasFrames = !!stack && stack.length > 0;
      this.addData(data);
      if (stack) {
        this.stack = stack.map(id => this.frames.get(id)!);
      }
      pausesById.set(pauseId, this);
    })();
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

    pausesByPoint.set(point, this);

    this.createWaiter = Promise.resolve();
    this._setPauseId(pauseId);
    this.point = point;
    this.time = time;
    this.hasFrames = hasFrames;
    this.addData(data);
    pausesById.set(pauseId, this);
  }

  addData(...datas: PauseData[]) {
    const pauseId = this.pauseId!;
    const point = this.point!;

    // Event handlers must be called before processing the data.
    // Calling _updateDataFronts() will add ValueFronts and mutate the underlying data.
    if (pauseDataHandlers.length > 0) {
      datas.forEach(data => {
        pauseDataHandlers.forEach(handler => handler(pauseId, point, data));
      });
    }

    datas.forEach(d => this._addDataObjects(d));
    datas.forEach(d => this._updateDataFronts(d));
  }

  ensureLoaded() {
    return this.createWaiter;
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
      if (!this.rawFrames.has(f.frameId)) {
        const rawFrame = cloneDeep(f);
        this.ThreadFront.updateMappedLocation(rawFrame.location);
        this.ThreadFront.updateMappedLocation(rawFrame.functionLocation);
        this.rawFrames.set(f.frameId, rawFrame);
      }
    });
    (scopes || []).forEach(s => {
      if (!this.scopes.has(s.scopeId)) {
        this.scopes.set(s.scopeId, s as WiredScope);
      }
      if (!this.rawScopes.has(s.scopeId)) {
        this.rawScopes.set(s.scopeId, cloneDeep(s));
      }
    });
    (objects || []).forEach(o => {
      if (!this.objects.has(o.objectId)) {
        this.objects.set(o.objectId, o as WiredObject);
      }
    });
    this.emit("objects", objects || []);
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
        assert(scope, `scope not found (scope ID: ${id})`);
        return scope;
      })
    );
  }

  async getScopes(frameId: FrameId) {
    const frame = this.frames.get(frameId);
    assert(frame, `frame not found (frame ID: ${frameId})`);

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

  async sendMessage<P, R>(
    method: (parameters: P, sessionId?: SessionId, pauseId?: PauseId) => R,
    params: P
  ) {
    await this.pauseIdWaiter.promise;
    assert(this.pauseId, "pauseId not set before sending a message");
    return await method(params, this.sessionId, this.pauseId);
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
    assert(this.createWaiter, "no createWaiter");
    await this.createWaiter;

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
