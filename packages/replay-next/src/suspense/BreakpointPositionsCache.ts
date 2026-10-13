import {
  SameLineSourceLocations as ProtocolSameLineSourceLocations,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import { Cache, IntervalCache, createCache, createIntervalCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { bucketBreakpointLines } from "../utils/source";

export type BreakpointPositionsByLine = Map<number, ProtocolSameLineSourceLocations>;

export const breakpointPositionsIntervalCache: IntervalCache<
  number,
  [replayClient: ReplayClientInterface, sourceId: ProtocolSourceId],
  ProtocolSameLineSourceLocations
> = createIntervalCache({
  debugLabel: "BreakpointPositions2",
  getKey: (client, sourceId) => sourceId,
  getPointForValue: location => location.line,
  load: async (begin, end, client, sourceId) => {
    const breakablePositions = await client.getBreakpointPositions(sourceId, {
      start: {
        line: begin,
        column: 0,
      },
      end: {
        line: end,
        column: Number.MAX_SAFE_INTEGER,
      },
    });

    return breakablePositions;
  },
});

export const breakpointPositionsByLineCache: Cache<
  [
    replayClient: ReplayClientInterface,
    sourceId: ProtocolSourceId,
    startLine: number,
    endLine: number
  ],
  Map<number, ProtocolSameLineSourceLocations>
> = createCache({
  config: { immutable: true },
  debugLabel: "BreakpointPositionsByLine",
  getKey: ([client, sourceId, begin, end]) => {
    const [startLine, endLine] = bucketBreakpointLines(begin, end);
    return `${sourceId}:${startLine}-${endLine}`;
  },
  load: async ([client, sourceId, begin, end]) => {
    const [startLine, endLine] = bucketBreakpointLines(begin, end);
    const breakablePositions = await breakpointPositionsIntervalCache.readAsync(
      startLine,
      endLine,
      client,
      sourceId
    );

    const breakablePositionsByLine = new Map<number, ProtocolSameLineSourceLocations>();
    for (const position of breakablePositions) {
      // Maps iterate items in insertion order - this is useful later
      breakablePositionsByLine.set(position.line, position);
    }

    return breakablePositionsByLine;
  },
});
