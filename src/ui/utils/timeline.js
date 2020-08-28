const timelineMarkerWidth = 7;

// calculate pixel distance from two times
export function getPixelDistance({ to, from, zoom, overlayWidth }) {
  const toPos = getVisiblePosition({ time: to, zoom });
  const fromPos = getVisiblePosition({ time: from, zoom });

  return Math.abs((toPos - fromPos) * overlayWidth);
}

// Get the position of a time on the visible part of the timeline,
// in the range [0, 1].
export function getVisiblePosition({ time, zoom }) {
  if (!time) {
    return 0;
  }

  if (time <= zoom.startTime) {
    return 0;
  }

  if (time >= zoom.endTime) {
    return 1;
  }

  return (time - zoom.startTime) / (zoom.endTime - zoom.startTime);
}

// Get the pixel offset for a time.
export function getPixelOffset({ time, overlayWidth, zoom }) {
  return getVisiblePosition({ time, zoom }) * overlayWidth;
}

// Get the percent value for the left offset of a message.
export function getLeftOffset({ overlayWidth, time, zoom }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const messageWidth = (timelineMarkerWidth / overlayWidth) * 100;

  return Math.max(position - messageWidth / 2, 0);
}

// Get the percent value for the left offset of a comment.
export function getCommentLeftOffset({ overlayWidth, time, zoom, commentWidth }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const messageWidth = (commentWidth / overlayWidth) * 100;

  return Math.min(Math.max(position, 0), 100 - messageWidth);
}

// Get the percent value for the left offset of a comment marker.
export function getMarkerLeftOffset({ overlayWidth, time, zoom, markerWidth }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const commentMarkerWidth = (markerWidth / overlayWidth) * 100;
  const pausedLocationMarkerWidth = (1 / overlayWidth) * 100;

  return Math.max(position + pausedLocationMarkerWidth - commentMarkerWidth / 2, 0);
}

// Get the percent value for the midpoint of a time in the timeline.
export function getTimeMidpoint({ overlayWidth, time, zoom }) {
  const position = getVisiblePosition({ time, zoom }) * 100;
  const pausedLocationMarkerWidth = (1 / overlayWidth) * 100;

  return Math.max(position + pausedLocationMarkerWidth / 2, 0);
}
