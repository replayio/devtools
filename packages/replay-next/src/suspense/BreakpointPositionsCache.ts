import {
  SameLineSourceLocations as ProtocolSameLineSourceLocations,
  SourceId as ProtocolSourceId,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

export type BreakpointPositionsResult = [
  breakablePositions: ProtocolSameLineSourceLocations[],
  breakablePositionsByLine: Map<number, ProtocolSameLineSourceLocations>
];

export const breakpointPositionsCache: Cache<
  [replayClient: ReplayClientInterface, sourceId: ProtocolSourceId],
  BreakpointPositionsResult
> = createCache({
  config: { immutable: true },
  debugLabel: "BreakpointPositions",
  getKey: ([client, sourceId]) => sourceId,
  load: async ([client, sourceId]) => {
    const breakablePositions = await client.getBreakpointPositions(sourceId, null);

    const breakablePositionsByLine = new Map<number, ProtocolSameLineSourceLocations>();
    // The positions are already sorted by line number in `ReplayClient.getBreakpointPositions`
    for (let position of breakablePositions) {
      // TODO BAC-2329
      // The backend sometimes returns duplicate columns per line;
      // In order to prevent the frontend from showing something weird, let's dedupe them here.
      const uniqueSortedColumns = Array.from(new Set(position.columns));
      uniqueSortedColumns.sort((a, b) => a - b);
      position.columns = uniqueSortedColumns;

      // Maps iterate items in insertion order - this is useful later
      breakablePositionsByLine.set(position.line, position);
    }
    return [breakablePositions, breakablePositionsByLine];
  },
});
