import { ThreadFront } from "protocol/thread";
import { selectors } from "../reducers";
import FullStory from "ui/utils/fullstory";

import {
  screenshotCache,
  addLastScreen,
  getGraphicsAtTime,
  paintGraphics,
  mostRecentPaintOrMouseEvent,
  getMostRecentPaintPoint,
} from "protocol/graphics";

export async function setupTimeline(recordingId, { dispatch }) {
  ThreadFront.on("paused", args => dispatch(onPaused(args)));
  ThreadFront.on("endpoint", args => dispatch(onEndpoint(args)));
  ThreadFront.warpCallback = onWarp;
  const description = await ThreadFront.getRecordingDescription(recordingId);
  dispatch(setRecordingDescription(description));
  window.addEventListener("resize", () => dispatch(updateTimelineDimensions()));
}

function onWarp(point, time) {
  const { startTime, endTime } = selectors.getZoomRegion(store.getState());
  if (time < startTime) {
    const startEvent = mostRecentPaintOrMouseEvent(startTime);
    if (startEvent) {
      return { point: startEvent.point, time: startTime };
    }
  }

  if (time > endTime) {
    const endEvent = mostRecentPaintOrMouseEvent(endTime);
    if (endEvent) {
      return { point: endEvent.point, time: endTime };
    }
  }

  return null;
}

function onEndpoint({ point, time }) {
  return ({ getState, dispatch }) => {
    // This could be called before setRecordingDescription.
    // These two methods should be commoned up.
    const screenshot = selectors.getScreenShot(getState());
    addLastScreen(screenshot, point, time);

    dispatch(setTimelineState({ currentTime: time }));
  };
}

function onPaused({ time }) {
  return async ({ dispatch, getState }) => {
    FullStory.event("paused");

    dispatch(setTimelineState({ currentTime: time, playback: null }));

    const { screen, mouse } = await getGraphicsAtTime(time);

    if (screen && selectors.getCurrentTime(getState()) == time) {
      dispatch(setTimelineState({ screenShot: screen, mouse }));
      paintGraphics(screen, mouse);
    }
  };
}

function setRecordingDescription({ duration, lastScreen }) {
  return ({ dispatch, getState }) => {
    const zoomRegion = selectors.getZoomRegion(getState());

    // Paint the last screen to get it up quickly, even though we don't know yet
    // which execution point this is and have warped here.
    paintGraphics(lastScreen);

    dispatch(
      setTimelineState({
        recordingDuration: duration,
        currentTime: duration,
        screenShot: lastScreen,
        zoomRegion: { ...zoomRegion, endTime: duration },
      })
    );
  };
}

export function updateTimelineDimensions() {
  return ({ dispatch }) => {
    const el = document.querySelector(".progressBar");
    const width = el ? el.clientWidth : 1;
    const left = el ? el.getBoundingClientRect().left : 1;
    const top = el ? el.getBoundingClientRect().top : 1;
    dispatch(setTimelineState({ timelineDimensions: { width, left, top } }));
  };
}

export function setTimelineState(state) {
  return { type: "set_timeline_state", state };
}

export function setTimelineToTime({ time, offset }) {
  return async ({ dispatch, getState }) => {
    try {
      dispatch(updateTooltip({ left: offset }));
      dispatch(setTimelineState({ hoverTime: time }));

      const paintPoint = getMostRecentPaintPoint(time);
      if (!paintPoint) return;
      const { point, paintHash } = paintPoint;
      const screen = await screenshotCache.getScreenshotForTooltip(point, paintHash);

      const currentTime = selectors.getHoverTime(getState());
      if (currentTime === time) {
        dispatch(updateTooltip({ screen, left: offset }));
      }
    } catch {}
  };
}

export function setTimelineToMessage({ message, offset }) {
  return async ({ dispatch, getState }) => {
    try {
      dispatch(updateTooltip({ left: offset }));
      dispatch(setTimelineState({ highlightedMessage: message.id }));

      const paintPoint = getMostRecentPaintPoint(message.executionPointTime);
      if (!paintPoint) return;
      const { point, paintHash } = paintPoint;
      const screen = await screenshotCache.getScreenshotForTooltip(point, paintHash);

      const currentMessageId = selectors.getHighlightedMessage(getState());
      if (currentMessageId === message.id) {
        dispatch(updateTooltip({ screen, left: offset }));
      }
    } catch {}
  };
}

export function hideTooltip() {
  return ({ dispatch }) => {
    dispatch(updateTooltip(null));
    dispatch(setTimelineState({ hoverTime: null, highlightedMessage: null }));
  };
}

function updateTooltip(tooltip) {
  return { type: "update_tooltip", tooltip };
}

export function setZoomRegion(region) {
  FullStory.event("timeline::zoom");
  return { type: "set_zoom", region };
}

export function seek(point, time, hasFrames) {
  return () => {
    FullStory.event("seek");
    ThreadFront.timeWarp(point, time, hasFrames);
  };
}
