import differenceInMinutes from "date-fns/differenceInMinutes";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import differenceInWeeks from "date-fns/differenceInWeeks";
import differenceInMonths from "date-fns/differenceInMonths";
import differenceInYears from "date-fns/differenceInYears";
import { TimeStampedPointRange } from "@replayio/protocol";
import { padStart } from "lodash";
import prettyMilliseconds from "pretty-ms";

export function formatDuration(ms: number) {
  return prettyMilliseconds(ms, { millisecondsDecimalDigits: 1 });
}

export function formatRelativeTime(date: Date): string {
  const minutes = differenceInMinutes(Date.now(), date);
  const days = differenceInCalendarDays(Date.now(), date);
  const weeks = differenceInWeeks(Date.now(), date);
  const months = differenceInMonths(Date.now(), date);
  const years = differenceInYears(Date.now(), date);

  if (years > 0) {
    return `${years}y`;
  }
  if (months > 0) {
    return `${months}mo`;
  }
  if (weeks > 0) {
    return `${weeks}w`;
  }
  if (days > 0) {
    return `${days}d`;
  }
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "Now";
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
