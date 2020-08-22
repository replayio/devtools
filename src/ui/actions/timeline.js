import { ThreadFront } from "protocol/thread";
import { selectors } from "../reducers";
import FullStory from "ui/utils/fullstory";

import {
  addLastScreen,
  getGraphicsAtTime,
  paintGraphics,
  mostRecentPaintOrMouseEvent,
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
    const startPoint = mostRecentPaintOrMouseEvent(startTime).point;
    return { point: startPoint, time: startTime };
  }

  if (time > endTime) {
    const endPoint = mostRecentPaintOrMouseEvent(endTime).point;
    return { point: endPoint, time: endTime };
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

    if (selectors.getCurrentTime(getState()) == time) {
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
