import {
  ExecutionPoint,
  getHitCountsParameters,
  getHitCountsResult,
  HitCount,
  SameLineSourceLocations,
} from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
// eslint-disable-next-line
import { client } from "protocol/socket";
import groupBy from "lodash/groupBy";

export const combineHitCounts = (hitCountsForSources: HitCount[]) => {
  const byLocation = groupBy(
    hitCountsForSources,
    hitCount => `${hitCount.location.line}:${hitCount.location.column}`
  );
  return Object.values(byLocation).map(hitCountsForSameLine => {
    return {
      ...hitCountsForSameLine[0],
      hits: hitCountsForSameLine.reduce((x, y) => x + y.hits, 0),
    };
  });
};

export const fetchHitCounts = async (
  sourceIds: string[],
  locations: SameLineSourceLocations[],
  range: { beginPoint: ExecutionPoint; endPoint: ExecutionPoint } | null
) => {
  let params: Omit<getHitCountsParameters, "sourceId"> = { locations, maxHits: 10000 };
  if (range !== null && range.beginPoint !== "" && range.endPoint !== "") {
    params.range = { begin: range.beginPoint, end: range.endPoint };
  }
  const sessionId = await ThreadFront.waitForSession();
  const correspondingHitCounts = await Promise.all(
    sourceIds.map(id => client.Debugger.getHitCounts({ sourceId: id, ...params }, sessionId))
  );

  // Merge hit counts from corresponding sources
  return correspondingHitCounts.reduce((acc: { hits: HitCount[] }, current) => {
    for (const newHit of current.hits) {
      console.log({ acc, current });
      const match = acc.hits.find(
        hit =>
          hit.location.line == newHit.location.line && hit.location.column == newHit.location.column
      );
      if (match) {
        match.hits += newHit.hits;
      }
    }
    return acc;
  }, {} as { hits: HitCount[] });
};
