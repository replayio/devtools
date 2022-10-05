import { Frame, PauseId } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { isCommandError, ProtocolError } from "shared/utils/error";
import { getFramesSuspense } from "./frameCache";
import { getFrameStepsSuspense } from "./frameStepsCache";

export function getPauseIdForPointSuspense(point: string, time: number): PauseId {
  const pause = ThreadFront.ensurePause(point, time);
  if (pause.pauseId) {
    return pause.pauseId;
  } else {
    throw pause.createWaiter;
  }
}

export function getAsyncParentPauseIdSuspense(
  pauseId: PauseId,
  asyncIndex: number
): PauseId | undefined {
  while (asyncIndex > 0) {
    const frames = getFramesSuspense(pauseId)!;
    if (!frames?.length) {
      return;
    }
    const steps = getFrameStepsSuspense(pauseId, frames[frames.length - 1].frameId);
    if (!steps?.length) {
      return;
    }
    const parentPauseId = getPauseIdForPointSuspense(steps[0].point, steps[0].time);
    if (parentPauseId === pauseId) {
      return;
    }
    pauseId = parentPauseId;
    asyncIndex--;
  }
  return pauseId;
}

export function getAsyncParentFramesSuspense(
  pauseId: PauseId,
  asyncIndex: number
): Frame[] | undefined {
  try {
    if (asyncIndex === 0) {
      return getFramesSuspense(pauseId);
    }
    const asyncParentPauseId = getAsyncParentPauseIdSuspense(pauseId, asyncIndex);
    if (!asyncParentPauseId) {
      return;
    }
    const frames = getFramesSuspense(asyncParentPauseId);
    if (!frames) {
      return;
    }
    return frames.slice(1);
  } catch (e: any) {
    // TODO [FE-795]: Communicate this to the user
    if (isCommandError(e, ProtocolError.TooManyPoints)) {
      console.error(e);
      return [];
    }
    throw e;
  }
}
