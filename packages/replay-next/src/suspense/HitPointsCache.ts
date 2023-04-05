import { Location, PointRange, TimeStampedPoint } from "@replayio/protocol";
import { ExecutionPoint } from "@replayio/protocol";
import sortBy from "lodash/sortBy";
import { createIntervalCache, isPromiseLike } from "suspense";

import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/analysisManager";
import { compareNumericStrings } from "protocol/utils";
import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { createFetchAsyncFromFetchSuspense } from "replay-next/src/utils/suspense";
import {
  HitPointStatus,
  HitPointsAndStatusTuple,
  ReplayClientInterface,
} from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";

export const hitPointsCache = createIntervalCache<
  ExecutionPoint,
  [replayClient: ReplayClientInterface, location: Location, condition: string | null],
  TimeStampedPoint
>({
  debugLabel: "HitPointsCache",
  getKey: (replayClient, location, condition) =>
    `${location.sourceId}:${location.line}:${location.column}:${condition}`,
  getPointForValue: timeStampedPoint => timeStampedPoint.point,
  comparePoints: compareNumericStrings,
  load: async (begin, end, replayClient, location, condition) => {
    const locations = replayClient.getCorrespondingLocations(location).map(location => ({
      location,
    }));
    await Promise.all(
      locations.map(location =>
        breakpointPositionsCache.readAsync(replayClient, location.location.sourceId)
      )
    );

    let hitPoints: TimeStampedPoint[] = [];
    let error: any;

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

      await replayClient.streamAnalysis(
        {
          effectful: false,
          locations,
          mapper,
          range: { begin, end },
        },
        {
          onResults: results => {
            hitPoints = hitPoints.concat(
              results
                .filter(({ value }) => value.match)
                .map(({ value: { point, time } }) => ({ point, time }))
            );
          },
          onError: err => (error = err),
        }
      ).resultsFinished;
    } else {
      await replayClient.streamAnalysis(
        {
          effectful: false,
          locations,
          mapper: "",
          range: { begin, end },
        },
        {
          onPoints: pointDescriptions => {
            hitPoints = hitPoints.concat(
              pointDescriptions.map(({ point, time }) => ({ point, time }))
            );
          },
          onError: err => (error = err),
        }
      ).pointsFinished;
    }

    if (error) {
      throw error;
    }
    hitPoints = sortBy(hitPoints, hitPoint => BigInt(hitPoint.point));
    return hitPoints;
  },
});

export function getHitPointsForLocationSuspense(
  client: ReplayClientInterface,
  location: Location,
  condition: string | null,
  range: PointRange
): HitPointsAndStatusTuple {
  let hitPoints: TimeStampedPoint[] = [];
  let status: HitPointStatus = "complete";
  try {
    hitPoints = hitPointsCache.read(range.begin, range.end, client, location, condition);
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
