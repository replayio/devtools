import { Location, PointRange, TimeStampedPoint } from "@replayio/protocol";
import { ExecutionPoint } from "@replayio/protocol";
import { createIntervalCache, isPromiseLike } from "suspense";

import { compareNumericStrings } from "protocol/utils";
import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { createFetchAsyncFromFetchSuspense } from "replay-next/src/utils/suspense";
import { MAX_POINTS_TO_RUN_EVALUATION } from "shared/client/ReplayClient";
import {
  HitPointStatus,
  HitPointsAndStatusTuple,
  ReplayClientInterface,
} from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";

import { mappedExpressionCache } from "./MappedExpressionCache";
import { cachePauseData, setPointAndTimeForPauseId } from "./PauseCache";

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
    const locations = replayClient.getCorrespondingLocations(location);
    await Promise.all(
      locations.map(location => breakpointPositionsCache.readAsync(replayClient, location.sourceId))
    );

    let hitPoints: TimeStampedPoint[] = [];

    if (condition) {
      const mappedCondition = await mappedExpressionCache.readAsync(
        replayClient,
        condition,
        location
      );
      await replayClient.runEvaluation(
        {
          selector: {
            kind: "locations",
            locations,
          },
          expression: mappedCondition,
          frameIndex: 0,
          limits: { begin, end },
        },
        results => {
          for (const result of results) {
            setPointAndTimeForPauseId(result.pauseId, result.point);
            cachePauseData(replayClient, result.pauseId, result.data);
          }
          hitPoints = hitPoints.concat(
            results.filter(result => result.returned?.value).map(result => result.point)
          );
        }
      );
      hitPoints.sort((a, b) => compareNumericStrings(a.point, b.point));
    } else {
      const pointDescriptions = await replayClient.findPoints(
        { kind: "locations", locations },
        { begin, end }
      );
      hitPoints = pointDescriptions.map(({ point, time }) => ({ point, time }));
    }

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
    if (hitPoints.length > MAX_POINTS_TO_RUN_EVALUATION) {
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
