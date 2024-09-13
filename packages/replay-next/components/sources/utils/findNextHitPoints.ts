import { TimeStampedPoint } from "@replayio/protocol";

import { compareTimeStampedPoints } from "protocol/utils";

export function findNextHitPoint(hitPoints: TimeStampedPoint[], executionPoint: TimeStampedPoint) {
  const hitPoint = hitPoints.find(point => compareTimeStampedPoints(point, executionPoint) > 0);
  if (hitPoint != null) {
    if (compareTimeStampedPoints(hitPoint, executionPoint) > 0) {
      return hitPoint;
    }
  }
  return null;
}
