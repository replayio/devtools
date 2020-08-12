import { ThreadFront } from "protocol/thread";
import { getScreenShot } from "../reducers";

import { selectors } from "../reducers";
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
    const screenshot = getScreenShot(getState());
    addLastScreen(screenshot, point, time);

    dispatch(setTimelineState({ currentTime: time }));
  };
}

function onPaused({ time }) {
  return async ({ dispatch, getState }) => {
    dispatch(setTimelineState({ currentTime: time, playback: null }));

    const { screen, mouse } = await getGraphicsAtTime(time);

    if (selectors.getCurrentTime(getState()) == time) {
      dispatch(setTimelineState({ screenShot: screen, mouse }));
      paintGraphics(screen, mouse);
    }

    // Update the users metadata so that other people visiting the recording can
    // see where we are. This functionality is currently disabled: without user
    // accounts, other tabs viewing the same recording will look like other
    // users, and we end up cluttering the UI even when there is a single actual
    // user viewing the recording. This will be revisited soon...
    /*
    const comment = {
      id: this.threadFront.sessionId,
      point,
      hasFrames,
      time,
      contents: UserComment,
      saved: true,
      isUser: true,
    };
    this.threadFront.updateMetadata(
      CommentsMetadata,
      comments => {
        // Stop trying to update if the thread has moved somewhere else.
        if (this.threadFront.currentPoint != point) {
          return null;
        }
        return [...(comments || []).filter(c => c.id != comment.id), comment];
      }
    );
    */
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

export function setTimelineState(state) {
  return { type: "set_timeline_state", state };
}

export function setZoomRegion(region) {
  return { type: "set_zoom", region };
}
