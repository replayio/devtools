import { TimeStampedPoint, TimeStampedPointRange } from "@replayio/protocol";
import clamp from "lodash/clamp";

import { assert } from "protocol/utils";
import { ZoomRegion } from "ui/state/timeline";

// Get the position of a time on the visible part of the timeline,
// in the range [0, 1] if the timeline is fully zoomed out.
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

export function isInFocusSpan(time: number, focusWindow: TimeStampedPointRange) {
  return time >= focusWindow.begin.time && time <= focusWindow.end.time;
}

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
