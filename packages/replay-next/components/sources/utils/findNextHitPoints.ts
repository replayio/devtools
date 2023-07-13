import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";

import { compareExecutionPoints, isExecutionPointsGreaterThan } from "replay-next/src/utils/time";

export function findNextHitPoint(hitPoints: TimeStampedPoint[], executionPoint: ExecutionPoint) {
  const hitPoint = hitPoints.find(point => compareExecutionPoints(point.point, executionPoint) > 0);
  if (hitPoint != null) {
    if (isExecutionPointsGreaterThan(hitPoint.point, executionPoint)) {
      return hitPoint;
    }
  }
  return null;
}
