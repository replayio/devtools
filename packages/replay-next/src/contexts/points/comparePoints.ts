import { Point } from "shared/client/types";

export default function comparePoints(pointA: Point, pointB: Point): number {
  const locationA = pointA.location;
  const locationB = pointB.location;
  if (locationA.sourceId !== locationB.sourceId) {
    return locationA.sourceId.localeCompare(locationB.sourceId);
  } else if (locationA.line !== locationB.line) {
    return locationA.line - locationB.line;
  } else if (locationA.column !== locationB.column) {
    return locationA.column - locationB.column;
  } else {
    return pointA.createdAt.getTime() - pointB.createdAt.getTime();
  }
}
