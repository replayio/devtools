import { TimeStampedPointRange } from "@replayio/protocol";

import {
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "replay-next/src/utils/time";

/**
 * When comparing timestamped point ranges, there are 4 possible outcomes:
 *
 * 1. Ranges are equal
 *
 * ••[•••]•••••
 * ••[•••]•••••
 *
 * 2. Next is less than prev
 *
 * ••••••[•••]•
 * ••[•••]•••••
 *
 * ••••[•••]•••
 * ••[•••]•••••
 *
 * ••••[•••]•••
 * •••[••••]•••
 *
 * 2. Next is greater than prev
 *
 * •[•••]••••••
 * •••[••••••]•
 *
 * ••[•••]••••••
 * •••••••[•••]•
 *
 * ••[•••]••••••
 * ••[•••••]••••
 *
 * 4. Ambiguous
 *
 * ••[••••••]••
 * ••••[•••]•••
 *
 * •••[••]•••••
 * •[••••••]•••
 *
 * ••[•••••]•••
 * •••[••••]•••
 *
 * •[••••]•••••
 * •[••]•••••••
 */

export function areTimeStampedPointRangesEqual(
  prev: Array<TimeStampedPointRange>,
  next: Array<TimeStampedPointRange>
): boolean {
  return (
    prev.find((prev, index) => {
      return !isTimeStampedPointRangeEqual(prev, next[index]);
    }) == null
  );
}

export function isTimeStampedPointRangeEqual(
  prev: TimeStampedPointRange | null,
  next: TimeStampedPointRange | null
): boolean {
  if (prev === null && next === null) {
    return true;
  } else if (prev !== null && next !== null) {
    return next.begin.point === prev.begin.point && next.end.point === prev.end.point;
  } else {
    return false;
  }
}

export function isTimeStampedPointRangeGreaterThan(
  prev: TimeStampedPointRange,
  next: TimeStampedPointRange
): boolean {
  return next.begin.point >= prev.begin.point && next.end.point > prev.end.point;
}

export function isTimeStampedPointRangeLessThan(
  prev: TimeStampedPointRange,
  next: TimeStampedPointRange
): boolean {
  return next.begin.point < prev.begin.point && next.end.point <= prev.end.point;
}

export function isTimeStampedPointRangeSubset(
  prev: TimeStampedPointRange | null,
  next: TimeStampedPointRange | null
): boolean {
  if (prev === null && next === null) {
    return true;
  } else if (prev === null) {
    // There was no previous range constraint.
    // No matter what the new range is, it will be a subset.
    return true;
  } else if (next === null) {
    // There is no new range constraint.
    // No matter what the previous range was, the new one is not a subset.
    return false;
  } else {
    return !(
      isExecutionPointsLessThan(next.begin.point, prev.begin.point) ||
      isExecutionPointsGreaterThan(next.end.point, prev.end.point)
    );
  }
}
