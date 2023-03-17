import { PointRange, SourceId, TimeStampedPointRange } from "@replayio/protocol";
import { createIntervalCache } from "suspense";

import { LineHitCounts, ReplayClientInterface } from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";
import { toPointRange } from "shared/utils/time";

import { breakpointPositionsCache } from "./BreakpointPositionsCache";

type MinMaxHitCountTuple = [minHitCount: number, maxHitCount: number];

// Source id and focus range to a tuple of min and max hit counts;
// this value is updated as we fetch new hit counts for the source (and focus range)
const minMaxHitCountsMap: Map<string, MinMaxHitCountTuple> = new Map();

function getKey(
  replayClient: ReplayClientInterface,
  sourceId: SourceId,
  focusRange: PointRange | null
) {
  return focusRange ? `${sourceId}:${focusRange.begin}-${focusRange.end}` : sourceId;
}

export const sourceHitCountsCache = createIntervalCache<
  number,
  [replayClient: ReplayClientInterface, sourceId: SourceId, focusRange: PointRange | null],
  [number, LineHitCounts]
>({
  debugLabel: "SourceHitCountsCache",
  getPointForValue: ([line]) => line,
  comparePoints: (a, b) => a - b,
  getKey,
  load: async (begin, end, client, sourceId, focusRange) => {
    try {
      const [locations] = await breakpointPositionsCache.readAsync(client, sourceId);
      const hitCounts = await client.getSourceHitCounts(
        sourceId,
        {
          start: { line: begin, column: 0 },
          end: { line: end, column: Number.MAX_SAFE_INTEGER },
        },
        locations,
        focusRange
      );

      // Refine cached min-max hit count as we load more information about a source.
      // Because hit counts may be filtered by a range of lines, this value may change as new information is loaded in.
      const key = getKey(client, sourceId, focusRange);
      let [minHitCount, maxHitCount] = minMaxHitCountsMap.get(key) || [Number.MAX_SAFE_INTEGER, 0];
      hitCounts.forEach(hitCount => {
        const { count } = hitCount;
        minHitCount = Math.min(minHitCount, count);
        maxHitCount = Math.max(maxHitCount, count);
      });
      minMaxHitCountsMap.set(key, [minHitCount, maxHitCount]);

      return [...hitCounts.entries()];
    } catch (error) {
      if (
        !isCommandError(error, ProtocolError.TooManyLocationsToPerformAnalysis) &&
        !isCommandError(error, ProtocolError.LinkerDoesNotSupportAction)
      ) {
        throw error;
      }
      return [];
    }
  },
});

export function getCachedMinMaxSourceHitCounts(
  sourceId: SourceId,
  focusRange: TimeStampedPointRange | PointRange | null
): MinMaxHitCountTuple | [null, null] {
  const key = getKey(null as any, sourceId, focusRange ? toPointRange(focusRange) : null);
  return minMaxHitCountsMap.get(key) || [null, null];
}
