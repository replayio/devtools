import { TimeStampedPointRange } from "@recordreplay/protocol";
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
