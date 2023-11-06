// ThreadFront is the main interface used to interact with the singleton
// WRP session. This interface is based on the one normally used when the
// devtools interact with a thread: at any time the thread is either paused
// at a particular point, or resuming on its way to pause at another point.
//
// This model is different from the one used in the WRP, where queries are
// performed on the state at different points in the recording. This layer
// helps with adapting the devtools to the WRP.

import { ExecutionPoint, Frame, PauseId, RecordingId, SessionId } from "@replayio/protocol";

import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";

import { client } from "../socket";
import { EventEmitter, assert } from "../utils";

export interface Pause {
  point: ExecutionPoint;
  time: number;
  pauseId: PauseId | null;
}

export interface PauseEventArgs {
  point: ExecutionPoint;
  time: number;
  openSource: boolean;
}

type ThreadFrontEvent = "paused" | "resumed";

class _ThreadFront {
  currentPoint: ExecutionPoint = "0";
  currentTime: number = 0;
  private currentPauseId: PauseId | null = null;

  // added by EventEmitter.decorate(ThreadFront)
  eventListeners!: Map<ThreadFrontEvent, ((value?: any) => void)[]>;
  on!: (name: ThreadFrontEvent, handler: (value?: any) => void) => void;
  off!: (name: ThreadFrontEvent, handler: (value?: any) => void) => void;
  emit!: (name: ThreadFrontEvent, value?: any) => void;

  /**
   * This may be null if the pauseId for the current execution point hasn't been
   * received from the backend yet. Use `await getCurrentPauseId()` instead if possible.
   */
  get currentPauseIdUnsafe() {
    return (
      this.currentPauseId ??
      pauseIdCache.getValueIfCached(null as any, this.currentPoint, this.currentTime) ??
      null
    );
  }

  async getCurrentPauseId(replayClient: ReplayClientInterface): Promise<PauseId> {
    return (
      this.currentPauseId ??
      (await pauseIdCache.readAsync(replayClient, this.currentPoint, this.currentTime))
    );
  }

  timeWarp(point: ExecutionPoint, time: number, openSource: boolean, frame?: Frame) {
    this.currentPoint = point;
    this.currentTime = time;
    this.currentPauseId = null;
    this.emit("paused", { point, time, openSource, frame });
  }

  timeWarpToPause(pause: Pause, openSource: boolean) {
    const { point, time, pauseId } = pause;
    assert(point && time, "point or time not set on pause");
    this.currentPoint = point;
    this.currentTime = time;
    this.currentPauseId = pauseId;
    this.emit("paused", { point, time, openSource });
  }
}

export const ThreadFront = new _ThreadFront();
EventEmitter.decorate<any, ThreadFrontEvent>(ThreadFront);
