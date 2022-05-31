import { TimeStampedPointRange } from "@replayio/protocol";
import { padStart } from "lodash";
import prettyMilliseconds from "pretty-ms";

export function formatDuration(ms: number) {
  return prettyMilliseconds(ms, { millisecondsDecimalDigits: 1 });
}

export function formatTimestamp(ms: number) {
  const seconds = Math.round(ms / 1000.0);
  return `${Math.floor(seconds / 60)}:${padStart(String(seconds % 60), 2, "0")}`;
}

export function isRangeEqual(
  prevRange: TimeStampedPointRange | null,
  nextRange: TimeStampedPointRange | null
): boolean {
  if (prevRange === null && nextRange === null) {
    return true;
  } else if (prevRange !== null && nextRange !== null) {
    return (
      nextRange.begin.time === prevRange.begin.time && nextRange.end.time === prevRange.end.time
    );
  } else {
    return false;
  }
}

export function isRangeSubset(
  prevRange: TimeStampedPointRange | null,
  nextRange: TimeStampedPointRange | null
): boolean {
  if (prevRange === null && nextRange === null) {
    return true;
  } else if (prevRange === null) {
    // There was no previous range constraint.
    // No matter what the new range is, it will be a subset.
    return true;
  } else if (nextRange === null) {
    // There is no new range constraint.
    // No matter what the previous range was, the new one is not a subset.
    return false;
  } else {
    return nextRange.begin.time >= prevRange.begin.time && nextRange.end.time <= prevRange.end.time;
  }
}
