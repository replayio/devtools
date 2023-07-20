import { ExecutionPoint, TimeStampedPoint } from "@replayio/protocol";
import findLast from "lodash/findLast";

import { compareExecutionPoints, isExecutionPointsLessThan } from "replay-next/src/utils/time";

export function findLastHitPoint(hitPoints: TimeStampedPoint[], executionPoint: ExecutionPoint) {
  const hitPoint = findLast(
    hitPoints,
    point => compareExecutionPoints(point.point, executionPoint) < 0
  );
  if (hitPoint != null) {
    if (isExecutionPointsLessThan(hitPoint.point, executionPoint)) {
      return hitPoint;
    }
  }
  return null;
}
