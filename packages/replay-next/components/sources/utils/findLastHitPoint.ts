import { TimeStampedPoint } from "@replayio/protocol";
import findLast from "lodash/findLast";

import { compareTimeStampedPoints } from "protocol/utils";

export function findLastHitPoint(hitPoints: TimeStampedPoint[], executionPoint: TimeStampedPoint) {
  const hitPoint = findLast(
    hitPoints,
    point => compareTimeStampedPoints(point, executionPoint) < 0
  );
  if (hitPoint != null) {
    if (compareTimeStampedPoints(hitPoint, executionPoint) < 0) {
      return hitPoint;
    }
  }
  return null;
}
