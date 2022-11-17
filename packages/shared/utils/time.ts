import { ExecutionPoint, PointRange, TimeStampedPointRange } from "@replayio/protocol";

export function isRangeInRegions(
  startPoint: ExecutionPoint,
  endPoint: ExecutionPoint,
  regions: TimeStampedPointRange[]
): boolean {
  const startPointNumber = BigInt(startPoint);
  const endPointNumber = BigInt(endPoint);
  return (
    regions.find(
      ({ begin, end }) =>
        startPointNumber >= BigInt(begin.point) && endPointNumber <= BigInt(end.point)
    ) != null
  );
}

export function isPointInRegions(point: ExecutionPoint, regions: TimeStampedPointRange[]): boolean {
  const pointNumber = BigInt(point);
  return (
    regions.find(
      ({ begin, end }) => pointNumber >= BigInt(begin.point) && pointNumber <= BigInt(end.point)
    ) != null
  );
}

export function isPointRange(range: TimeStampedPointRange | PointRange): range is PointRange {
  return typeof range.begin === "string";
}

export function isTimeInRegions(time: number, regions: TimeStampedPointRange[]) {
  return regions.find(({ begin, end }) => time >= begin.time && time <= end.time);
}

export function toPointRange(range: TimeStampedPointRange | PointRange): PointRange {
  if (isPointRange(range)) {
    return range;
  } else {
    return {
      begin: range.begin.point,
      end: range.end.point,
    };
  }
}
