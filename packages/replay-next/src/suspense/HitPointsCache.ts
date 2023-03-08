import { ExecutionPoint, Location, PointRange, TimeStampedPoint } from "@replayio/protocol";
import { createIntervalCache } from "suspense";

import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/analysisManager";
import { createFetchAsyncFromFetchSuspense } from "replay-next/src/utils/suspense";
import { compareExecutionPoints } from "replay-next/src/utils/time";
import {
  HitPointStatus,
  HitPointsAndStatusTuple,
  ReplayClientInterface,
} from "shared/client/types";
import { isThennable } from "shared/proxy/utils";
import { ProtocolError, isCommandError } from "shared/utils/error";

import { getBreakpointPositionsAsync } from "./SourcesCache";

export const hitPointCache = createIntervalCache<
  ExecutionPoint,
  [location: Location, condition: string | null, client: ReplayClientInterface],
  TimeStampedPoint
>({
  debugLabel: "hitPointCache",
  comparePoints: compareExecutionPoints,
  getPointForValue: ({ point }) => point,
  getKey: (location: Location, condition: string | null) => {
    return `${location.sourceId}:${location.line}:${location.column}:${condition}`;
  },
  load: async (
    begin: ExecutionPoint,
    end: ExecutionPoint,
    location: Location,
    condition: string | null,
    client: ReplayClientInterface
  ) => {
    const range: PointRange = { begin, end };

    const locations = client.getCorrespondingLocations(location).map(location => ({
      location,
    }));
    await Promise.all(
      locations.map(location => getBreakpointPositionsAsync(location.location.sourceId, client))
    );

    let caughtError: Error | undefined;
    let points: TimeStampedPoint[] = [];

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
            points.push(
              ...results
                .filter(({ value }) => value.match)
                .map(({ value: { point, time } }) => ({ point, time }))
            );
          },
          onError: error => {
            caughtError = error;
          },
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
            points.push(...pointDescriptions.map(({ point, time }) => ({ point, time })));
          },
          onError: error => {
            caughtError = error;
          },
        }
      ).pointsFinished;
    }

    if (caughtError) {
      throw caughtError;
    } else {
      return points;
    }
  },
});

export function getHitPointsForLocationSuspense(
  client: ReplayClientInterface,
  location: Location,
  condition: string | null,
  pointRange: PointRange
): HitPointsAndStatusTuple {
  const { begin, end } = pointRange;

  let hitPoints: TimeStampedPoint[] = [];
  let hitPointStatus: HitPointStatus = "complete";

  try {
    hitPoints = hitPointCache.read(begin, end, location, condition, client);

    if (hitPoints.length > MAX_POINTS_FOR_FULL_ANALYSIS) {
      hitPointStatus = "too-many-points-to-run-analysis";
    }
  } catch (error) {
    if (isThennable(error)) {
      throw error;
    }

    if (isCommandError(error, ProtocolError.TooManyPoints)) {
      hitPointStatus = "too-many-points-to-find";
    } else {
      console.error(error);

      hitPointStatus = "unknown-error";
    }
  }

  return [hitPoints, hitPointStatus];
}

export const getHitPointsForLocationAsync = createFetchAsyncFromFetchSuspense(
  getHitPointsForLocationSuspense
);
