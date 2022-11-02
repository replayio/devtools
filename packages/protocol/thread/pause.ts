import {
  ExecutionPoint,
  Frame,
  FrameId,
  NodeBounds,
  Object as ObjectDescription,
  ObjectId,
  ObjectPreview,
  PauseData,
  PauseId,
  PointDescription,
  Scope,
  ScopeId,
  SessionId,
  Value,
  repaintGraphicsResult,
} from "@replayio/protocol";

import { ProtocolError, isCommandError } from "shared/utils/error";

import { client } from "../socket";
import { Deferred, EventEmitter, assert, defer } from "../utils";
import type { ThreadFront as ThreadFrontType } from "./thread";

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

type PauseEvent = "objects";

export interface EvaluationResult {
  returned?: Value;
  exception?: Value;
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
  frames: Map<FrameId, Frame>;
  scopes: Map<ScopeId, Scope>;
  objects: Map<ObjectId, Object>;
  frameSteps: Map<string, PointDescription[]>;
  stack: Frame[] | undefined;
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
  }

  ensureLoaded() {
    return this.createWaiter;
  }

  private _addDataObjects({ frames, scopes, objects }: PauseData) {
    (frames || []).forEach(f => {
      if (!this.frames.has(f.frameId)) {
        this.ThreadFront.updateMappedLocation(f.location);
        this.ThreadFront.updateMappedLocation(f.functionLocation);
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
    this.emit("objects", objects || []);
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

  async sendMessage<P, R>(
    method: (parameters: P, sessionId?: SessionId, pauseId?: PauseId) => R,
    params: P
  ) {
    await this.pauseIdWaiter.promise;
    assert(this.pauseId, "pauseId not set before sending a message");
    return await method(params, this.sessionId, this.pauseId);
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
      try {
        const { steps } = await this.sendMessage(client.Pause.getFrameSteps, {
          frameId,
        });
        for (const step of steps) {
          this.ThreadFront.updateMappedLocation(step.frame);
        }
        this.frameSteps.set(frameId, steps);
      } catch (e) {
        // "There are too many points to complete this operation"
        // is expected if the frame is too long and should not be treated as an error.
        if (isCommandError(e, ProtocolError.TooManyPoints)) {
          this.frameSteps.set(frameId, []);
        } else {
          throw e;
        }
      }
    }
    return this.frameSteps.get(frameId)!;
  }
}
