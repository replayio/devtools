import { ExecutionPoint, PointRange, TimeStampedPointRange } from "@replayio/protocol";

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

export function isTimeStampedPointRange(
  range: TimeStampedPointRange | PointRange
): range is TimeStampedPointRange {
  return (
    typeof range.begin === "object" && range.begin !== null && typeof range.begin.point === "string"
  );
}

export function isTimeInRegions(time: number, regions: TimeStampedPointRange[]): boolean {
  return regions.find(({ begin, end }) => time >= begin.time && time <= end.time) != null;
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
