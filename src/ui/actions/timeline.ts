import {
  ExecutionPoint,
  PauseId,
  RecordingId,
  TimeStampedPoint,
  PauseDescription,
} from "@recordreplay/protocol";
import { Pause, ThreadFront } from "protocol/thread";
import { selectors } from "../reducers";
import {
  screenshotCache,
  addLastScreen,
  getGraphicsAtTime,
  paintGraphics,
  mostRecentPaintOrMouseEvent,
  nextPaintOrMouseEvent,
  getMostRecentPaintPoint,
} from "protocol/graphics";
import { UIStore, UIThunkAction } from ".";
import { Action } from "redux";
import { PauseEventArgs, RecordingDescription } from "protocol/thread/thread";
import { TimelineState, Tooltip, ZoomRegion } from "ui/state/timeline";

const { assert } = require("protocol/utils");
import { log } from "protocol/socket";

export type SetTimelineStateAction = Action<"set_timeline_state"> & {
  state: Partial<TimelineState>;
};
export type UpdateTooltipAction = Action<"update_tooltip"> & { tooltip: Tooltip | null };
export type SetZoomRegionAction = Action<"set_zoom"> & { region: ZoomRegion };
export type TimelineAction = SetTimelineStateAction | UpdateTooltipAction | SetZoomRegionAction;

export async function setupTimeline(recordingId: RecordingId, store: UIStore) {
  const { dispatch } = store;
  ThreadFront.on("paused", args => dispatch(onPaused(args)));
  ThreadFront.on("endpoint", args => dispatch(onEndpoint(args)));
  ThreadFront.warpCallback = onWarp(store);
  const description = await ThreadFront.getRecordingDescription();
  dispatch(setRecordingDescription(description));
  window.addEventListener("resize", () => dispatch(updateTimelineDimensions()));
}

function onWarp(store: UIStore) {
  return function (point: ExecutionPoint, time: number) {
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
  };
}

function onEndpoint({ point, time }: TimeStampedPoint): UIThunkAction {
  return ({ getState, dispatch }) => {
    // This could be called before setRecordingDescription.
    // These two methods should be commoned up.
    const screenshot = selectors.getScreenShot(getState());
    addLastScreen(screenshot, point, time);
    const zoomRegion = selectors.getZoomRegion(getState());
    const newZoomRegion = { ...zoomRegion, endTime: time };

    dispatch(
      setTimelineState({ currentTime: time, recordingDuration: time, zoomRegion: newZoomRegion })
    );
  };
}

function onPaused({ time }: PauseEventArgs): UIThunkAction {
  return async ({ dispatch, getState }) => {
    dispatch(setTimelineState({ currentTime: time, playback: null }));

    const { screen, mouse } = await getGraphicsAtTime(time);

    if (screen && selectors.getCurrentTime(getState()) == time) {
      dispatch(setTimelineState({ screenShot: screen, mouse }));
      paintGraphics(screen, mouse);
    }
  };
}

function setRecordingDescription({ duration, lastScreen }: RecordingDescription): UIThunkAction {
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

export function updateTimelineDimensions(): UIThunkAction {
  return ({ dispatch }) => {
    const el = document.querySelector(".progressBar");
    const width = el ? el.clientWidth : 1;
    const left = el ? el.getBoundingClientRect().left : 1;
    const top = el ? el.getBoundingClientRect().top : 1;
    dispatch(setTimelineState({ timelineDimensions: { width, left, top } }));
  };
}

export function setTimelineState(state: Partial<TimelineState>): SetTimelineStateAction {
  return { type: "set_timeline_state", state };
}

export function setTimelineToTime({
  time,
  offset,
}: {
  time: number;
  offset: number;
}): UIThunkAction {
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

export function setTimelineToMessage({
  message,
  offset,
}: {
  message: any;
  offset: number;
}): UIThunkAction {
  return async ({ dispatch, getState }) => {
    try {
      dispatch(updateTooltip({ left: offset }));
      dispatch(setTimelineState({ highlightedMessageId: message.id }));

      const paintPoint = getMostRecentPaintPoint(message.executionPointTime);
      if (!paintPoint) return;
      const { point, paintHash } = paintPoint;
      const screen = await screenshotCache.getScreenshotForTooltip(point, paintHash);

      const currentMessageId = selectors.getHighlightedMessageId(getState());
      if (currentMessageId === message.id) {
        dispatch(updateTooltip({ screen, left: offset }));
      }
    } catch {}
  };
}

export function hideTooltip(): UIThunkAction {
  return ({ dispatch }) => {
    dispatch(updateTooltip(null));
    dispatch(setTimelineState({ hoverTime: null, highlightedMessageId: null }));
  };
}

function updateTooltip(tooltip: Tooltip | null): UpdateTooltipAction {
  return { type: "update_tooltip", tooltip };
}

export function setZoomRegion(region: ZoomRegion): SetZoomRegionAction {
  return { type: "set_zoom", region };
}

export function seek(
  point: ExecutionPoint,
  time: number,
  hasFrames?: boolean,
  pauseId?: PauseId
): UIThunkAction {
  return () => {
    const pause = pauseId !== undefined ? Pause.getById(pauseId) : undefined;
    if (pause) {
      ThreadFront.timeWarpToPause(pause);
    } else {
      ThreadFront.timeWarp(point, time, hasFrames);
    }
  };
}

export function highlightLocation(location: Location) {
  return { type: "set_timeline_state", state: { highlightedLocation: location } };
}

export function unhighlightLocation() {
  return { type: "set_timeline_state", state: { highlightedLocation: null } };
}

/**
 * Playback the recording segment from `startTime` to `endTime`.
 * Optionally a `pauseTarget` may be given that will be seeked to after finishing playback.
 */
function playback(
  startTime: number,
  endTime: number,
  pauseTarget: PauseDescription
): UIThunkAction {
  return async ({ dispatch, getState }) => {
    if (pauseTarget) {
      assert(endTime <= pauseTarget.time);
    }

    let startDate = Date.now();
    let currentDate = startDate;
    let currentTime = startTime;
    let nextGraphicsTime;
    let nextGraphicsPromise;

    const prepareNextGraphics = () => {
      const { endTime } = selectors.getZoomRegion(getState());
      nextGraphicsTime = nextPaintOrMouseEvent(currentTime)?.time || endTime;
      nextGraphicsPromise = getGraphicsAtTime(nextGraphicsTime);
    };

    prepareNextGraphics();

    while (playback) {
      await new Promise(resolve => requestAnimationFrame(resolve));

      let playback = selectors.getPlayback(getState());
      if (!playback) {
        return;
      }

      currentDate = Date.now();
      currentTime = startTime + (currentDate - startDate);

      if (currentTime > endTime) {
        log(`FinishPlayback`);
        if (pauseTarget) {
          const { point, time, frame } = pauseTarget;
          dispatch(seek(point, time, !!frame));
        } else {
          dispatch(seekTime(endTime));
        }
        dispatch(setTimelineState({ currentTime: endTime, playback: null }));
        return;
      }

      dispatch(
        setTimelineState({
          currentTime,
          playback: { startTime, startDate, pauseTarget, time: currentTime },
        })
      );

      if (nextGraphicsTime && currentTime >= nextGraphicsTime) {
        await nextGraphicsPromise;

        if (!nextGraphicsPromise) {
          return;
        }

        const { screen, mouse } = nextGraphicsPromise;

        if (!playback) {
          return;
        }

        // Playback may have stalled waiting for `nextGraphicsPromise` and would jump
        // in the next iteration in order to catch up. To avoid jumps of more than
        // 100 milliseconds, we reset `startTime` and `startDate` as if playback had
        // been started right now
        if (Date.now() - currentDate > 100) {
          startTime = currentTime;
          startDate = Date.now();
          dispatch(
            setTimelineState({
              currentTime,
              playback: { startTime, startDate, pauseTarget, time: currentTime },
            })
          );
        }

        if (screen) {
          paintGraphics(screen, mouse);
        }
        prepareNextGraphics();
      }
    }
  };
}

export function startPlayback(): UIThunkAction {
  return async ({ dispatch, getState }) => {
    log(`StartPlayback`);

    const currentTime = selectors.getCurrentTime(getState());
    const startDate = Date.now();
    let startTime = currentTime;
    let startPoint = ThreadFront.currentPoint;

    dispatch(
      setTimelineState({
        playback: { startTime, startDate },
        currentTime: startTime,
      })
    );

    const pauseTarget = await ThreadFront.resumeTarget(startPoint);

    const zoomRegion = selectors.getZoomRegion(getState());
    const zoomEndTime = zoomRegion.endTime;
    const endTime = pauseTarget ? Math.min(pauseTarget.time, zoomEndTime) : zoomEndTime;

    dispatch(playback(startTime, endTime, pauseTarget));
  };
}

export function stopPlayback(): UIThunkAction {
  return ({ dispatch, getState }) => {
    log(`StopPlayback`);
    const playback = selectors.getPlayback(getState());

    if (playback) {
      dispatch(seekTime(playback.time));
    }

    dispatch(setTimelineState({ playback: null }));
  };
}

export function seekTime(targetTime: number): UIThunkAction {
  return ({ dispatch }) => {
    if (targetTime == null) {
      return null;
    }

    const event = mostRecentPaintOrMouseEvent(targetTime);

    if (event) {
      // Seek to the exact time provided, even if it does not match up with a
      // paint event. This can cause some slight UI weirdness: resumes done in
      // the debugger will be relative to the point instead of the time,
      // so e.g. running forward could land at a point before the time itself.
      // This could be fixed but doesn't seem worth worrying about for now.
      dispatch(seek(event.point, targetTime));
    }
  };
}
