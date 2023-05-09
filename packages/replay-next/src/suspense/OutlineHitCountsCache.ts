import {
  ClassOutline,
  FunctionOutline,
  PointRange,
  SameLineSourceLocations,
  SourceId,
  SourceLocation,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { sourceOutlineCache } from "./SourceOutlineCache";

export interface FunctionOutlineWithHitCounts extends FunctionOutline {
  hits: number;
}

export interface SourceOutlineWithHitCounts {
  classes: ClassOutline[];
  functions: FunctionOutlineWithHitCounts[];
}

export const outlineHitCountsCache: Cache<
  [
    replayClient: ReplayClientInterface,
    sourceId: SourceId | undefined,
    focusRange: PointRange | null
  ],
  SourceOutlineWithHitCounts
> = createCache({
  config: { immutable: true },
  debugLabel: "OutlineHitCountsCache",
  getKey: ([replayClient, sourceId, focusRange]) =>
    sourceId && focusRange ? `${sourceId}:${focusRange.begin}-${focusRange.end}` : sourceId ?? "",
  load: async ([replayClient, sourceId, focusRange]) => {
    if (!sourceId) {
      return { classes: [], functions: [] };
    }

    const { classes, functions } = await sourceOutlineCache.readAsync(replayClient, sourceId);

    const locations: SameLineSourceLocations[] = [];
    for (const functionOutline of functions) {
      const location = functionOutline.breakpointLocation;
      if (location) {
        locations.push({ line: location.line, columns: [location.column] });
      }
    }

    const correspondingSourceIds = replayClient.getCorrespondingSourceIds(sourceId);

    const hitCountsByLocationKey = new Map<string, number>();
    await Promise.all(
      correspondingSourceIds.map(async sourceId => {
        const hitCounts = await replayClient.getSourceHitCounts(sourceId, locations, focusRange);

        hitCounts.forEach(({ hits, location }) => {
          const locationKey = `${location.line}:${location.column}`;
          const previous = hitCountsByLocationKey.get(locationKey) ?? 0;
          hitCountsByLocationKey.set(locationKey, previous + hits);
        });
      })
    );

    const functionsWithHitCounts = functions.map(functionOutline => {
      const location = functionOutline.breakpointLocation;
      let hits = 0;
      if (location) {
        const locationKey = `${location.line}:${location.column}`;
        hits = hitCountsByLocationKey.get(locationKey) ?? 0;
      }
      return Object.assign({}, functionOutline, { hits });
    });

    return { classes, functions: functionsWithHitCounts };
  },
});
