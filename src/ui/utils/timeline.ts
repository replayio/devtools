import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import clamp from "lodash/clamp";
import sortedIndexBy from "lodash/sortedIndexBy";
import sortedLastIndexBy from "lodash/sortedLastIndexBy";

import { assert } from "protocol/utils";
import { FocusRegion, ZoomRegion } from "ui/state/timeline";

import { timelineMarkerWidth } from "../constants";

// calculate pixel distance from two times
export function getPixelDistance({
  to,
  from,
  zoom,
  overlayWidth,
}: {
  to: number;
  from: number;
  zoom: ZoomRegion;
  overlayWidth: number;
}) {
  const toPos = getVisiblePosition({ time: to, zoom });
  const fromPos = getVisiblePosition({ time: from, zoom });

  return Math.abs((toPos - fromPos) * overlayWidth);
}

// Get the position of a time on the visible part of the timeline,
// in the range [0, 1] if the timeline is fully zommed out.
export function getVisiblePosition({ time, zoom }: { time: number | null; zoom: ZoomRegion }) {
  if (!time) {
    return 0;
  }

  return (time - zoom.beginTime) / (zoom.endTime - zoom.beginTime);
}

interface GetOffsetParams {
  time: number;
  overlayWidth: number;
  zoom: ZoomRegion;
}

// Get the pixel offset for a time.
export function getPixelOffset({ time, overlayWidth, zoom }: GetOffsetParams) {
  return getVisiblePosition({ time, zoom }) * overlayWidth;
}

// Get the percent value for the left offset of a message.
export function getLeftOffset({ overlayWidth, time, zoom }: GetOffsetParams) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const messageWidth = (timelineMarkerWidth / overlayWidth) * 100;

  return Math.max(position - messageWidth / 2, 0);
}

// Get the percent value for the left offset of a comment.
export function getCommentLeftOffset({
  overlayWidth,
  time,
  zoom,
  commentWidth,
}: GetOffsetParams & { commentWidth: number }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const messageWidth = (commentWidth / overlayWidth) * 100;

  return Math.min(Math.max(position, 0), 100 - messageWidth);
}

// Get the percent value for the left offset of a comment marker.
export function getMarkerLeftOffset({
  overlayWidth,
  time,
  zoom,
  markerWidth,
}: GetOffsetParams & { markerWidth: number }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const commentMarkerWidth = (markerWidth / overlayWidth) * 100;

  return position - commentMarkerWidth / 2;
}

// Get the percent value for the midpoint of a time in the timeline.
export function getTimeMidpoint({ overlayWidth, time, zoom }: GetOffsetParams) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const pausedLocationMarkerWidth = (1 / overlayWidth) * 100;

  return Math.max(position + pausedLocationMarkerWidth / 2, 0);
}

export function getNewZoomRegion({
  hoverTime,
  newScale,
  zoomRegion,
  recordingDuration,
}: {
  hoverTime: number;
  newScale: number;
  zoomRegion: ZoomRegion;
  recordingDuration: number;
}) {
  let scale = zoomRegion.scale;
  let length = zoomRegion.endTime - zoomRegion.beginTime;
  let leftToHover = hoverTime - zoomRegion.beginTime;
  let rightToHover = zoomRegion.endTime - hoverTime;

  let newLength = recordingDuration / newScale;
  let newBegin = zoomRegion.beginTime - (newLength - length) * (leftToHover / length);
  let newEnd = zoomRegion.endTime + (newLength - length) * (rightToHover / length);

  if (newBegin < 0) {
    newBegin = 0;
    newEnd = newLength;
  } else if (newEnd > recordingDuration) {
    newEnd = recordingDuration;
    newBegin = recordingDuration - newLength;
  }

  return { begin: newBegin, end: newEnd };
}

const TIME_REGEX = /^([0-9]+)(:[0-9]{0,2}){0,1}(\.[0-9]{0,3}){0,1}$/;

export function isValidTimeString(formatted: string): boolean {
  return TIME_REGEX.test(formatted);
}

// Parse milliseconds from a formatted time string containing any combination of minutes, seconds, and milliseconds.
export function getSecondsFromFormattedTime(formatted: string) {
  formatted = formatted.trim();
  if (!formatted) {
    return 0;
  }

  if (!isValidTimeString(formatted)) {
    throw Error(`Invalid format "${formatted}"`);
  }

  let minutes = 0;
  let seconds = 0;
  let milliseconds = 0;

  if (formatted.includes(".")) {
    const index = formatted.indexOf(".");
    const millisecondsString = formatted.substring(index + 1);
    switch (millisecondsString.length) {
      case 1: {
        milliseconds = parseInt(millisecondsString) * 100;
        break;
      }
      case 2: {
        milliseconds = parseInt(millisecondsString) * 10;
        break;
      }
      case 3: {
        milliseconds = parseInt(millisecondsString);
        break;
      }
    }

    formatted = formatted.substring(0, index);
  }

  if (formatted.includes(":")) {
    const index = formatted.indexOf(":");
    minutes = parseInt(formatted.substring(0, index));
    seconds = parseInt(formatted.substring(index + 1));
  } else {
    seconds = parseInt(formatted);
  }

  return minutes * 60 * 1000 + seconds * 1000 + milliseconds;
}

export function isSameTimeStampedPointRange(
  range1: TimeStampedPointRange,
  range2: TimeStampedPointRange
) {
  const sameBegin =
    range1.begin.point === range2.begin.point && range1.begin.time === range2.begin.time;
  const sameEnd = range1.end.point === range2.end.point && range1.end.time === range2.end.time;

  return sameBegin && sameEnd;
}

export function isInFocusSpan(time: number, focusRegion: FocusRegion) {
  return time >= focusRegion.begin.time && time <= focusRegion.end.time;
}

export function isPointInRegions(regions: TimeStampedPointRange[], point: string) {
  return regions.find(
    r => BigInt(point) >= BigInt(r.begin.point) && BigInt(point) <= BigInt(r.end.point)
  );
}

export function isTimeInRegions(time: number, regions?: TimeStampedPointRange[]): boolean {
  return !!regions?.some(region => time >= region.begin.time && time <= region.end.time);
}

export function rangeForFocusRegion(focusRegion: FocusRegion): TimeStampedPointRange {
  return { begin: focusRegion.begin || { time: 0, point: "0" }, end: focusRegion.end };
}

export const overlap = (a: TimeStampedPointRange[], b: TimeStampedPointRange[]) => {
  const overlapping: TimeStampedPointRange[] = [];
  a.forEach(aRegion => {
    b.forEach(bRegion => {
      if (aRegion.begin.time <= bRegion.end.time && aRegion.end.time >= bRegion.begin.time) {
        overlapping.push({
          begin: aRegion.begin.time > bRegion.begin.time ? aRegion.begin : bRegion.begin,
          end: aRegion.end.time < bRegion.end.time ? aRegion.end : bRegion.end,
        });
      }
    });
  });
  return overlapping;
};

export function getPositionFromTime(time: number, zoomRegion: ZoomRegion) {
  const position = getVisiblePosition({ time, zoom: zoomRegion }) * 100;
  const clampedPosition = clamp(position, 0, 100);
  return clampedPosition;
}

export function getTimeFromPosition(
  pageX: number,
  targetRect: { left: number; width: number },
  zoomRegion: ZoomRegion
): number {
  const x = pageX - targetRect.left;
  const zoomRegionDuration = zoomRegion.endTime - zoomRegion.beginTime;
  const percentage = clamp(x / targetRect.width, 0, 1);
  const time = zoomRegion.beginTime + percentage * zoomRegionDuration;
  return time;
}

export function isFocusRegionSubset(
  prevFocusRegion: FocusRegion | null,
  nextFocusRegion: FocusRegion | null
): boolean {
  if (prevFocusRegion === null) {
    // Previously the entire timeline was selected.
    // No matter what the new focus region is, it will be a subset.
    return true;
  } else if (nextFocusRegion === null) {
    // The new selection includes the entire timeline.
    // No matter what the previous focus region is, the new one is not a subset.
    return false;
  } else {
    return (
      nextFocusRegion.begin.time >= prevFocusRegion.begin.time &&
      nextFocusRegion.end.time <= prevFocusRegion.end.time
    );
  }
}

export function filterToFocusRegion<T extends TimeStampedPoint>(
  sortedPoints: T[],
  focusRegion: FocusRegion | null
): [filtered: T[], filteredBeforeCount: number, filteredAfterCount: number] {
  if (!focusRegion) {
    return [sortedPoints, 0, 0];
  }

  const { begin: beginPoint, end: endPoint } = rangeForFocusRegion(focusRegion);

  const beginIndex = sortedIndexBy(sortedPoints, beginPoint, ({ point }) => BigInt(point));
  const endIndex = sortedLastIndexBy(sortedPoints, endPoint, ({ point }) => BigInt(point));

  const filteredBeforeCount = beginIndex;
  const filteredAfterCount = sortedPoints.length - endIndex;
  const filtered = sortedPoints.slice(beginIndex, endIndex);

  return [filtered, filteredBeforeCount, filteredAfterCount];
}

function assertSorted(a: TimeStampedPoint[]) {
  a.reduce(
    (prev, curr) => {
      // It would be cheaper to compare time but at least one recording has a bizarre time (see BAC-2339).
      // Truthfully, since points are more fine-grained than time, we should be comparing them anyway.
      assert(BigInt(prev.point) <= BigInt(curr.point));
      return curr;
    },
    { point: "0", time: 0 }
  );
}

export function mergeSortedPointLists(
  a: TimeStampedPoint[],
  b: TimeStampedPoint[]
): TimeStampedPoint[] {
  if (process.env.NODE_ENV !== "production") {
    assertSorted(a);
    assertSorted(b);
  }

  // Merge from the smaller array into the larger one.
  let [source, destination] = a.length < b.length ? [a, b] : [b, a];

  let sourceIndex = 0;
  let destinationIndex = 0;

  while (sourceIndex < source.length) {
    const sourcePoint = source[sourceIndex];

    let destinationIndexPoint = destination[destinationIndex];

    if (destinationIndexPoint == null) {
      destination.push(sourcePoint);
      sourceIndex++;
    } else if (sourcePoint.point === destinationIndexPoint.point) {
      // Don't add duplicates.
      sourceIndex++;
    } else if (BigInt(sourcePoint.point) < BigInt(destinationIndexPoint.point)) {
      destination.splice(destinationIndex, 0, sourcePoint);
      sourceIndex++;
      destinationIndex++;
    } else {
      destinationIndex++;
    }
  }
  return destination;
}
