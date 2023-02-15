import { ExecutionPoint, loadedRegions as LoadedRegions } from "@replayio/protocol";

import { PauseAndFrameId } from "replay-next/src/contexts/SelectedFrameContext";
import { getFramesSuspense } from "replay-next/src/suspense/FrameCache";
import { getPauseIdSuspense } from "replay-next/src/suspense/PauseCache";
import { createFetchAsyncFromFetchSuspense } from "replay-next/src/utils/suspense";
import { ReplayClientInterface } from "shared/client/types";
import { isThennable } from "shared/proxy/utils";
import { isPointInRegions } from "shared/utils/time";

export function getPauseAndFrameIdSuspends(
  replayClient: ReplayClientInterface,
  executionPoint: ExecutionPoint,
  time: number,
  loadedRegions: LoadedRegions | null,
  throwOnFail: boolean
): PauseAndFrameId | null {
  const isLoaded = loadedRegions !== null && isPointInRegions(executionPoint, loadedRegions.loaded);
  if (!isLoaded) {
    return null;
  }

  let pauseAndFrameId: PauseAndFrameId | null = null;
  try {
    const pauseId = getPauseIdSuspense(replayClient, executionPoint, time);
    const frames = getFramesSuspense(replayClient, pauseId);
    const frameId = frames?.[0]?.frameId ?? null;
    if (frameId !== null) {
      pauseAndFrameId = {
        frameId,
        pauseId,
      };
    }
  } catch (errorOrThennable) {
    if (throwOnFail || isThennable(errorOrThennable)) {
      throw errorOrThennable;
    }

    console.error(errorOrThennable);
  }

  return pauseAndFrameId;
}

export const getPauseAndFrameIdAsync = createFetchAsyncFromFetchSuspense(
  getPauseAndFrameIdSuspends
);
