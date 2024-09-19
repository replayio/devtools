import { Location, PointDescription, PointRange, TimeStampedPoint } from "@replayio/protocol";
import { createCache } from "suspense";

import { breakpointPositionsIntervalCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { bucketBreakpointLines } from "replay-next/src/utils/source";
import { compareExecutionPoints, breakdownSupplementalId } from "protocol/utils";
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
import { cachePauseData, setPointAndTimeForPauseId, updateMappedLocation } from "./PauseCache";
import { sourcesByIdCache } from "./SourcesCache";

export const hitPointsCache = createFocusIntervalCacheForExecutionPoints<
  [replayClient: ReplayClientInterface, location: Location, condition: string | null],
  PointDescription
>({
  debugLabel: "HitPointsCache",
  getKey: (replayClient, location, condition) =>
    `${location.sourceId}:${location.line}:${location.column}:${condition}`,
  getPointForValue: timeStampedPoint => timeStampedPoint.point,
  load: async (begin, end, replayClient, location, condition) => {
    const sources = await sourcesByIdCache.readAsync(replayClient);
    const locations = getCorrespondingLocations(sources, location);
    await Promise.all(
      locations.map(location => {
        const [startLine, endLine] = bucketBreakpointLines(location.line, location.line);
        return breakpointPositionsIntervalCache.readAsync(
          startLine,
          endLine,
          replayClient,
          location.sourceId
        );
      })
    );

    let hitPoints: PointDescription[] = [];

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
      hitPoints.sort((a, b) => compareExecutionPoints(a.point, b.point));
    } else {
      const pointDescriptions = await replayClient.findPoints(
        { kind: "locations", locations },
        { begin, end }
      );
      // Note that PointDescriptions include the current frame.
      // Type-wise we're going to return `TimeStampedPoint`s,
      // but the extra frame data is there in this case.
      hitPoints = pointDescriptions;
    }

    for (const point of hitPoints) {
      if (point.frame) {
        updateMappedLocation(sources, point.frame);
      }
    }

    return hitPoints;
  },
});

export const hitPointsForLocationCache = createCache<
  [
    replayClient: ReplayClientInterface,
    range: PointRange,
    location: Location,
    condition: string | null
  ],
  HitPointsAndStatusTuple
>({
  debugLabel: "HitPointsForLocationCache",
  getKey: ([replayClient, range, location, condition]) =>
    `[${range.begin}-${range.end}]:${location.sourceId}:${location.line}:${location.column}:${condition}`,
  load: async ([replayClient, range, location, condition]) => {
    let hitPoints: TimeStampedPoint[] = [];
    let status: HitPointStatus = "complete";
    try {
      const { id: sourceId, supplementalIndex } = breakdownSupplementalId(location.sourceId);
      if (supplementalIndex) {
        if (condition) {
          throw new Error("NYI");
        }
        const sources = await sourcesByIdCache.readAsync(replayClient);
        const locations = getCorrespondingLocations(sources, location);
        hitPoints = await replayClient.findPoints(
          { kind: "locations", locations }, undefined
        );
      } else {
        hitPoints = await hitPointsCache.readAsync(
          BigInt(range.begin),
          BigInt(range.end),
          replayClient,
          location,
          condition
        );
      }
      if (hitPoints.length > MAX_POINTS_TO_RUN_EVALUATION) {
        status = "too-many-points-to-run-analysis";
      }
    } catch (error) {
      if (isCommandError(error, ProtocolError.TooManyPoints)) {
        status = "too-many-points-to-find";
      } else {
        console.error(error);

        status = "unknown-error";
      }
    }

    return [hitPoints, status];
  },
});
