import { PointRange, SourceId, TimeStampedPointRange } from "@replayio/protocol";

import { binarySearch } from "protocol/utils";
import { LineHitCounts, LineNumberToHitCountMap, ReplayClientInterface } from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";
import { toPointRange } from "shared/utils/time";

import { bucketBreakpointLines } from "../utils/source";
import { getCorrespondingSourceIds } from "../utils/sources";
import { breakpointPositionsIntervalCache } from "./BreakpointPositionsCache";
import { createFocusIntervalCache } from "./FocusIntervalCache";
import { sourcesByIdCache } from "./SourcesCache";

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

export const sourceHitCountsCache = createFocusIntervalCache<
  number,
  [replayClient: ReplayClientInterface, sourceId: SourceId, focusRange: PointRange | null],
  [number, LineHitCounts]
>({
  debugLabel: "SourceHitCountsCache",
  getPointForValue: ([line]) => line,
  getKey,
  load: async (begin, end, client, sourceId, focusRange) => {
    try {
      const [startLine, endLine] = bucketBreakpointLines(begin, end);

      const locations = await breakpointPositionsIntervalCache.readAsync(
        startLine,
        endLine,
        client,
        sourceId
      );

      // Note that since this is a sorted array, we can do better than a plain .filter() for performance.
      const startIndex = binarySearch(
        0,
        locations.length,
        (index: number) => begin - locations[index].line
      );
      const stopIndex = binarySearch(
        startIndex,
        locations.length,
        (index: number) => end - locations[index].line
      );

      const firstColumnLocations = locations.slice(startIndex, stopIndex + 1).map(location => ({
        ...location,
        columns: location.columns.slice(0, 1),
      }));
      const sources = await sourcesByIdCache.readAsync(client);
      const correspondingSourceIds = getCorrespondingSourceIds(sources, sourceId);

      const hitCounts: LineNumberToHitCountMap = new Map();

      await Promise.all(
        correspondingSourceIds.map(async sourceId => {
          const protocolHitCounts = await client.getSourceHitCounts(
            sourceId,
            firstColumnLocations,
            focusRange
          );

          const lines: Set<number> = new Set();

          // Sum hits across corresponding sources,
          // But only record the first column's hits for any given line in a source.
          protocolHitCounts.forEach(({ hits, location }) => {
            const { line } = location;
            if (!lines.has(line)) {
              lines.add(line);

              const previous = hitCounts.get(line) || 0;
              if (previous) {
                hitCounts.set(line, {
                  count: previous.count + hits,
                  firstBreakableColumnIndex: previous.firstBreakableColumnIndex,
                });
              } else {
                hitCounts.set(line, {
                  count: hits,
                  firstBreakableColumnIndex: location.column,
                });
              }
            }
          });

          return hitCounts;
        })
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
        !isCommandError(error, ProtocolError.TooManyLocations) &&
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
): MinMaxHitCountTuple | [undefined, undefined] {
  const key = getKey(null as any, sourceId, focusRange ? toPointRange(focusRange) : null);
  return minMaxHitCountsMap.get(key) || [undefined, undefined];
}
