import { ExecutionPoint, SourceId, TimeStampedPoint } from "@replayio/protocol";

import { binarySearch } from "protocol/utils";
import {
  compareExecutionPoints,
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "replay-next/src/utils/time";
import { Point } from "shared/client/types";

type HitPointAndIndexTuple = [hitPoint: TimeStampedPoint, index: number];
type NullTuple = [null, null];

const nullTuple: NullTuple = [null, null];

export function findClosestHitPoint(
  hitPoints: TimeStampedPoint[],
  executionPoint: ExecutionPoint
): HitPointAndIndexTuple | NullTuple {
  const index = binarySearch(0, hitPoints.length, (index: number) =>
    compareExecutionPoints(executionPoint, hitPoints[index].point)
  );
  if (index >= 0 && index < hitPoints.length) {
    const hitPoint = hitPoints[index];
    return [hitPoint, index];
  }
  return nullTuple;
}

export function findHitPoint(
  hitPoints: TimeStampedPoint[],
  executionPoint: ExecutionPoint
): HitPointAndIndexTuple | NullTuple {
  const [hitPoint, hitPointIndex] = findClosestHitPoint(hitPoints, executionPoint);
  if (hitPoint !== null && hitPoint.point === executionPoint) {
    return [hitPoint, hitPointIndex];
  }
  return nullTuple;
}

export function findHitPointAfter(
  hitPoints: TimeStampedPoint[],
  executionPoint: ExecutionPoint
): HitPointAndIndexTuple | NullTuple {
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
  return nullTuple;
}

export function findHitPointBefore(
  hitPoints: TimeStampedPoint[],
  executionPoint: ExecutionPoint
): HitPointAndIndexTuple | NullTuple {
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
  return nullTuple;
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
    .filter(
      point =>
        point.sourceLocation.sourceId === sourceId && point.sourceLocation.line === lineNumber
    )
    .sort((a, b) => a.sourceLocation.column - b.sourceLocation.column);
}
