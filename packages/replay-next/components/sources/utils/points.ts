import { ExecutionPoint, SourceId, TimeStampedPoint } from "@replayio/protocol";

import { binarySearch } from "protocol/utils";
import {
  compareExecutionPoints,
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "replay-next/src/utils/time";
import { Point } from "shared/client/types";

type HitPointAndIndexTuple = [hitPoint: TimeStampedPoint, index: number];
type NoMatchTuple = [null, number];

const noMatchTuple: NoMatchTuple = [null, -1];

export function findClosestHitPoint(
  hitPoints: TimeStampedPoint[],
  executionPoint: ExecutionPoint
): HitPointAndIndexTuple | NoMatchTuple {
  const index = binarySearch(0, hitPoints.length, (index: number) =>
    compareExecutionPoints(executionPoint, hitPoints[index].point)
  );

  if (index >= 0 && index < hitPoints.length) {
    const hitPoint = hitPoints[index];
    if (hitPoint.point === executionPoint) {
      // Exact match
      return [hitPoint, index];
    }

    const executionBigInt = BigInt(executionPoint);
    const currentBigInt = BigInt(hitPoint.point);

    if (executionBigInt < currentBigInt) {
      const currentDelta = currentBigInt - executionBigInt;
      const prevHitPoint = hitPoints[index - 1] ?? null;
      if (prevHitPoint) {
        const prevBigInt = BigInt(prevHitPoint.point);
        const prevDelta = executionBigInt - prevBigInt;
        if (prevDelta < currentDelta) {
          return [prevHitPoint, index - 1];
        }
      }
    } else {
      const currentDelta = executionBigInt - currentBigInt;
      const nextHitPoint = hitPoints[index + 1] ?? null;
      if (nextHitPoint) {
        const nextBigInt = BigInt(nextHitPoint.point);
        const nextDelta = nextBigInt - executionBigInt;
        if (nextDelta < currentDelta) {
          return [nextHitPoint, index + 1];
        }
      }
    }

    // Nearest match
    return [hitPoint, index];
  }

  return noMatchTuple;
}

export function findHitPoint(
  hitPoints: TimeStampedPoint[],
  executionPoint: ExecutionPoint,
  exactMatch: boolean = true
): HitPointAndIndexTuple | NoMatchTuple {
  const [hitPoint, hitPointIndex] = findClosestHitPoint(hitPoints, executionPoint);
  if (hitPoint !== null) {
    if (hitPoint.point === executionPoint) {
      return [hitPoint, hitPointIndex];
    } else if (!exactMatch) {
      return [hitPoint, hitPointIndex];
    }
  }
  return noMatchTuple;
}

export function findHitPointAfter(
  hitPoints: TimeStampedPoint[],
  executionPoint: ExecutionPoint
): HitPointAndIndexTuple | NoMatchTuple {
  const [hitPoint, index] = findClosestHitPoint(hitPoints, executionPoint);
  if (hitPoint !== null) {
    if (isExecutionPointsGreaterThan(hitPoint.point, executionPoint)) {
      return [hitPoint, index];
    } else {
      const nextIndex = index + 1;
      if (nextIndex < hitPoints.length) {
        return [hitPoints[nextIndex], nextIndex];
      }
    }
  }
  return noMatchTuple;
}

export function findHitPointBefore(
  hitPoints: TimeStampedPoint[],
  executionPoint: ExecutionPoint
): HitPointAndIndexTuple | NoMatchTuple {
  const [hitPoint, index] = findClosestHitPoint(hitPoints, executionPoint);
  if (hitPoint !== null) {
    if (isExecutionPointsLessThan(hitPoint.point, executionPoint)) {
      return [hitPoint, index];
    } else {
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        return [hitPoints[prevIndex], prevIndex];
      }
    }
  }
  return noMatchTuple;
}

export function findPointForLocation(
  points: Point[],
  sourceId: SourceId,
  lineNumber: number
): Point | null {
  return findPointsForLocation(points, sourceId, lineNumber)[0] ?? null;
}

export function findPointsForLocation(
  points: Point[],
  sourceId: SourceId,
  lineNumber: number
): Point[] {
  return points
    .filter(point => point.location.sourceId === sourceId && point.location.line === lineNumber)
    .sort((a, b) => a.location.column - b.location.column);
}
