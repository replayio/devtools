import {
  CallStack,
  ExecutionPoint,
  FrameId,
  NodeBounds,
  PauseData,
  PauseId,
  SessionId,
  Value,
} from "@replayio/protocol";

import { ProtocolError, isCommandError } from "shared/utils/error";

import { client } from "../socket";
import { Deferred, EventEmitter, assert, defer } from "../utils";
import type { ThreadFront as ThreadFrontType } from "./thread";

const pausesById = new Map<PauseId, Pause>();
const pausesByPoint = new Map<ExecutionPoint, Pause>();

// Allow the new Object Inspector's Suspense cache to observe Pause data and pre-cache it.
type PauseDataHandler = (pauseId: PauseId, pauseData: PauseData, stack?: CallStack) => void;
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
      this.addData(data, stack);
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

  addData(data: PauseData, stack?: CallStack) {
    const pauseId = this.pauseId!;

    // Event handlers must be called before processing the data.
    // Calling _updateDataFronts() will add ValueFronts and mutate the underlying data.
    if (pauseDataHandlers.length > 0) {
      pauseDataHandlers.forEach(handler => handler(pauseId, data, stack));
    }
  }

  ensureLoaded() {
    return this.createWaiter;
  }

  async sendMessage<P, R>(
    method: (parameters: P, sessionId?: SessionId, pauseId?: PauseId) => R,
    params: P
  ) {
    await this.pauseIdWaiter.promise;
    assert(this.pauseId, "pauseId not set before sending a message");
    return await method(params, this.sessionId, this.pauseId);
  }
}
