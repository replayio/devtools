import {
  ExecutionPoint,
  PointRange,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import { sameSupplementalIndex } from "protocol/utils";

const supportsPerformanceNow =
  typeof performance !== "undefined" && typeof performance.now === "function";

export function minTimeStampedPoint(points: (TimeStampedPoint | null)[]): TimeStampedPoint | null {
  let min: TimeStampedPoint | null = null;
  for (const point of points) {
    if (point) {
      min = min === null ? point : BigInt(point.point) < BigInt(min.point) ? point : min;
    }
  }
  return min;
}

export function maxTimeStampedPoint(points: (TimeStampedPoint | null)[]): TimeStampedPoint | null {
  let max: TimeStampedPoint | null = null;
  for (const point of points) {
    if (point) {
      max = max === null ? point : BigInt(point.point) > BigInt(max.point) ? point : max;
    }
  }
  return max;
}

export function isRangeInRegions(
  range: TimeStampedPointRange | PointRange,
  regions: TimeStampedPointRange[]
): boolean {
  let beginPointBigInt: bigint | null = null;
  let beginTime: number | null = null;
  let endPointBigInt: bigint | null = null;
  let endTime: number | null = null;

  if (isTimeStampedPointRange(range)) {
    beginPointBigInt = BigInt(range.begin.point);
    beginTime = range.begin.time;
    endPointBigInt = BigInt(range.end.point);
    endTime = range.end.time;
  } else {
    beginPointBigInt = BigInt(range.begin);
    endPointBigInt = BigInt(range.end);
  }

  if (
    beginPointBigInt !== null &&
    endPointBigInt !== null &&
    regions.find(
      ({ begin, end }) =>
        beginPointBigInt! >= BigInt(begin.point) && endPointBigInt! <= BigInt(end.point)
    ) == null
  ) {
    // No loaded regions contain this range of points.
    return false;
  }

  if (
    beginTime !== null &&
    endTime !== null &&
    regions.find(
      ({ begin, end }) => beginTime! >= BigInt(begin.time) && endTime! <= BigInt(end.time)
    ) == null
  ) {
    // No loaded regions contain this range of times.
    return false;
  }

  return true;
}

export function isPointInRegion(point: ExecutionPoint, range: TimeStampedPointRange): boolean {
  if (!sameSupplementalIndex(point, range.begin.point)) {
    return true;
  }
  const pointNumber = BigInt(point);
  return pointNumber >= BigInt(range.begin.point) && pointNumber <= BigInt(range.end.point);
}

export function isPointInRegions(point: ExecutionPoint, regions: TimeStampedPointRange[]): boolean {
  return regions.some(range => isPointInRegion(point, range));
}

export function isPointRange(range: TimeStampedPointRange | PointRange): range is PointRange {
  return typeof range.begin === "string";
}

export function isTimeStampedPointRange(
  range: TimeStampedPointRange | PointRange
): range is TimeStampedPointRange {
  return (
    typeof range.begin === "object" && range.begin !== null && typeof range.begin.point === "string"
  );
}

export function isTimeInRegion(time: number, range: TimeStampedPointRange): boolean {
  return time >= range.begin.time && time <= range.end.time;
}

export function isTimeInRegions(time: number, regions: TimeStampedPointRange[]): boolean {
  return regions.find(range => isTimeInRegion(time, range)) != null;
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

// Format a time value to mm:ss
export function getFormattedTime(time: number, showMilliseconds: boolean = false) {
  const date = new Date(time);
  let minutes = date.getUTCMinutes();
  let seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();

  if (!showMilliseconds) {
    if (milliseconds >= 500) {
      seconds++;
    }
    if (seconds >= 60) {
      seconds = 0;
      minutes++;
    }
  }

  if (showMilliseconds) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds
      .toString()
      .padStart(3, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}
export function now(): number {
  if (supportsPerformanceNow) {
    return performance.now();
  }
  return Date.now();
}
