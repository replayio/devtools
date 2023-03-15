import {
  ExecutionPoint,
  FrameId,
  loadedRegions as LoadedRegions,
  PauseId,
} from "@replayio/protocol";
import { isPromiseLike } from "suspense";

import { topFrameCache } from "replay-next/src/suspense/FrameCache";
import { getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { createFetchAsyncFromFetchSuspense } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import { isPointInRegions } from "shared/utils/time";

export function getPauseAndFrameIdSuspends(
  replayClient: ReplayClientInterface,
  executionPoint: ExecutionPoint,
  time: number,
  loadedRegions: LoadedRegions | null,
  throwOnFail: boolean
): {
  frameId: FrameId | null;
  pauseId: PauseId | null;
} {
  const isLoaded = loadedRegions !== null && isPointInRegions(executionPoint, loadedRegions.loaded);
  if (!isLoaded) {
    return { frameId: null, pauseId: null };
  }

  let frameId: FrameId | null = null;
  let pauseId: PauseId | null = null;

  try {
    pauseId = getPauseIdSuspense(replayClient, executionPoint, time);

    const topFrame = topFrameCache.read(replayClient, pauseId);
    frameId = topFrame?.frameId ?? null;
  } catch (errorOrThenable) {
    if (throwOnFail || isPromiseLike(errorOrThenable)) {
      throw errorOrThenable;
    }

    console.error(errorOrThenable);
  }

  return { frameId, pauseId };
}

export const getPauseAndFrameIdAsync = createFetchAsyncFromFetchSuspense(
  getPauseAndFrameIdSuspends
);
