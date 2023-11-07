import { PauseId, TimeStampedPointRange } from "@replayio/protocol";

import {
  getExecutionPoint,
  getPauseId,
  getTime,
} from "devtools/client/debugger/src/reducers/pause";
import { assert } from "protocol/utils";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { ReplayClientInterface } from "shared/client/types";
import { UIState } from "ui/state";

export type TimeRange = {
  start: number;
  end: number;
};

export function getNonLoadingRegionTimeRanges(
  loadingRegions: TimeStampedPointRange[],
  endTime: number
): TimeRange[] {
  if (!loadingRegions.length) {
    return [{ end: endTime, start: 0 }];
  }
  let nonLoadingRegions = loadingRegions[0].begin.time
    ? [{ end: loadingRegions[0].begin.time, start: 0 }]
    : [];

  for (let i = 0; i < loadingRegions.length; i++) {
    const start = loadingRegions[i].end.time;
    const end = i === loadingRegions.length - 1 ? endTime : loadingRegions[i + 1].begin.time;

    if (start === end) {
      continue;
    }

    nonLoadingRegions.push({ end, start });
  }

  return nonLoadingRegions;
}

export async function getCurrentPauseId(
  replayClient: ReplayClientInterface,
  state: UIState
): Promise<PauseId> {
  const pauseId = getPauseId(state);
  if (pauseId) {
    return pauseId;
  }
  const point = getExecutionPoint(state);
  assert(point);
  const time = getTime(state);
  return pauseIdCache.readAsync(replayClient, point, time);
}
