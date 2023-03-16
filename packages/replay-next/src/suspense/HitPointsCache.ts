import { Location, PointRange, TimeStampedPoint } from "@replayio/protocol";
import { isPromiseLike } from "suspense";

import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/analysisManager";
import { createFetchAsyncFromFetchSuspense } from "replay-next/src/utils/suspense";
import {
  HitPointStatus,
  HitPointsAndStatusTuple,
  ReplayClientInterface,
} from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";

import { RangeCache, createGenericRangeCache } from "./createGenericRangeCache";
import { getBreakpointPositionsAsync } from "./SourcesCache";

const hitPointCaches = new Map<string, RangeCache<TimeStampedPoint>>();

function getHitPointsCache(location: Location, condition: string | null) {
  const key = `${location.sourceId}:${location.line}:${location.column}:${condition}`;
  if (!hitPointCaches.has(key)) {
    hitPointCaches.set(key, createHitPointsCache(location, condition));
  }
  return hitPointCaches.get(key)!;
}

function createHitPointsCache(location: Location, condition: string | null) {
  return createGenericRangeCache<TimeStampedPoint>(
    async (client, range, cacheValues, cacheError) => {
      const locations = client.getCorrespondingLocations(location).map(location => ({
        location,
      }));
      await Promise.all(
        locations.map(location => getBreakpointPositionsAsync(location.location.sourceId, client))
      );

      if (condition) {
        const mapper = `
          const { point, time } = input;
          const { frame: frameId } = sendCommand("Pause.getTopFrame");

          const { result: conditionResult } = sendCommand(
            "Pause.evaluateInFrame",
            { frameId, expression: ${JSON.stringify(condition)}, useOriginalScopes: true }
          );

          let result;
          if (conditionResult.returned) {
            const { returned } = conditionResult;
            if ("value" in returned && !returned.value) {
              result = 0;
            } else if (!Object.keys(returned).length) {
              // Undefined.
              result = 0;
            } else {
              result = 1;
            }
          } else {
            result = 1;
          }

          return [
            {
              key: point,
              value: {
                match: result,
                point,
                time,
              },
            },
          ];
        `;

        await client.streamAnalysis(
          {
            effectful: false,
            locations,
            mapper,
            range,
          },
          {
            onResults: results => {
              cacheValues(
                results
                  .filter(({ value }) => value.match)
                  .map(({ value: { point, time } }) => ({ point, time }))
              );
            },
            onError: cacheError,
          }
        ).resultsFinished;
      } else {
        await client.streamAnalysis(
          {
            effectful: false,
            locations,
            mapper: "",
            range,
          },
          {
            onPoints: pointDescriptions => {
              cacheValues(pointDescriptions.map(({ point, time }) => ({ point, time })));
            },
            onError: cacheError,
          }
        ).pointsFinished;
      }
    },
    hitPoint => hitPoint.point
  );
}

export function getHitPointsForLocationSuspense(
  client: ReplayClientInterface,
  location: Location,
  condition: string | null,
  range: PointRange
): HitPointsAndStatusTuple {
  const { getValuesSuspense } = getHitPointsCache(location, condition);
  let hitPoints: TimeStampedPoint[] = [];
  let status: HitPointStatus = "complete";
  try {
    hitPoints = getValuesSuspense(client, range);
    if (hitPoints.length > MAX_POINTS_FOR_FULL_ANALYSIS) {
      status = "too-many-points-to-run-analysis";
    }
  } catch (errorOrPromise) {
    if (isPromiseLike(errorOrPromise)) {
      throw errorOrPromise;
    }
    if (isCommandError(errorOrPromise, ProtocolError.TooManyPoints)) {
      status = "too-many-points-to-find";
    } else {
      console.error(errorOrPromise);
      status = "unknown-error";
    }
  }
  return [hitPoints, status];
}

export const getHitPointsForLocationAsync = createFetchAsyncFromFetchSuspense(
  getHitPointsForLocationSuspense
);
