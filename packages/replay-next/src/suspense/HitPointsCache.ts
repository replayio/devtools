import { Location, PointRange, TimeStampedPoint } from "@replayio/protocol";
import { isPromiseLike } from "suspense";

import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { compareNumericStrings } from "replay-next/src/utils/string";
import { createFetchAsyncFromFetchSuspense } from "replay-next/src/utils/suspense";
import { MAX_POINTS_TO_RUN_EVALUATION } from "shared/client/ReplayClient";
import {
  HitPointStatus,
  HitPointsAndStatusTuple,
  ReplayClientInterface,
} from "shared/client/types";
import { ProtocolError, isCommandError } from "shared/utils/error";

import { getCorrespondingLocations } from "../utils/sources";
import { createFocusIntervalCacheForExecutionPoints } from "./FocusIntervalCache";
import { mappedExpressionCache } from "./MappedExpressionCache";
import { cachePauseData, setPointAndTimeForPauseId } from "./PauseCache";
import { sourcesByIdCache } from "./SourcesCache";

export const hitPointsCache = createFocusIntervalCacheForExecutionPoints<
  [replayClient: ReplayClientInterface, location: Location, condition: string | null],
  TimeStampedPoint
>({
  debugLabel: "HitPointsCache",
  getKey: (replayClient, location, condition) =>
    `${location.sourceId}:${location.line}:${location.column}:${condition}`,
  getPointForValue: timeStampedPoint => timeStampedPoint.point,
  load: async (begin, end, replayClient, location, condition) => {
    const sources = await sourcesByIdCache.readAsync(replayClient);
    const locations = getCorrespondingLocations(sources, location);
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
            cachePauseData(replayClient, sources, result.pauseId, result.data);
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
    hitPoints = hitPointsCache.read(
      BigInt(range.begin),
      BigInt(range.end),
      client,
      location,
      condition
    );
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
