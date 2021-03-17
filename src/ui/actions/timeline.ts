import { ExecutionPoint, PauseId, RecordingId } from "@recordreplay/protocol";
import { Pause, ThreadFront } from "protocol/thread";
import { client, log } from "protocol/socket";
import {
  addLastScreen,
  getGraphicsAtTime,
  paintGraphics,
  mostRecentPaintOrMouseEvent,
  nextPaintOrMouseEvent,
  nextPaintEvent,
  previousPaintEvent,
  getFirstMeaningfulPaint,
} from "protocol/graphics";
import { selectors } from "ui/reducers";
import { UIStore, UIThunkAction } from ".";
import { Action } from "redux";
import { PauseEventArgs, RecordingDescription } from "protocol/thread/thread";
import { TimelineState, Tooltip, ZoomRegion, HoveredItem } from "ui/state/timeline";
import { getFirstComment } from "ui/hooks/comments";
import { getTest } from "ui/utils/environment";
import { waitForTime } from "protocol/utils";
const { features } = require("ui/utils/prefs");

export type SetTimelineStateAction = Action<"set_timeline_state"> & {
  state: Partial<TimelineState>;
};
export type SetPlaybackStalledAction = Action<"set_playback_stalled"> & { stalled: boolean };
export type UpdateTooltipAction = Action<"update_tooltip"> & { tooltip: Tooltip | null };
export type SetZoomRegionAction = Action<"set_zoom"> & { region: ZoomRegion };
export type SetHoveredItemAction = Action<"set_hovered_item"> & {
  hoveredItem: HoveredItem | null;
};

export type TimelineActions =
  | SetTimelineStateAction
  | SetPlaybackStalledAction
  | UpdateTooltipAction
  | SetZoomRegionAction
  | SetHoveredItemAction;

export async function setupTimeline(recordingId: RecordingId, store: UIStore) {
  const { dispatch, getState } = store;
  ThreadFront.on("paused", args => dispatch(onPaused(args)));
  ThreadFront.warpCallback = onWarp(store);
  const description = await ThreadFront.getRecordingDescription();
  dispatch(setRecordingDescription(description));
  window.addEventListener("resize", () => dispatch(updateTimelineDimensions()));

  await ThreadFront.waitForSession();
  const { endpoint } = await client.Session.getEndpoint({}, ThreadFront.sessionId!);
  let { point, time } = endpoint;
  if ("lastScreen" in description && description.lastScreen) {
    addLastScreen(description.lastScreen, point, time);
  }

  const zoomRegion = selectors.getZoomRegion(getState());
  const newZoomRegion = { ...zoomRegion, endTime: time };
  dispatch(
    setTimelineState({ currentTime: time, recordingDuration: time, zoomRegion: newZoomRegion })
  );

  let hasFrames = false;
  if (!getTest()) {
    const firstComment = await getFirstComment(recordingId);
    if (firstComment) {
      ({ point, time } = firstComment);
      hasFrames = firstComment.has_frames;
    } else {
      const firstMeaningfulPaint = await getFirstMeaningfulPaint(10);
      if (firstMeaningfulPaint) {
        ({ point, time } = firstMeaningfulPaint);
      }
    }
  }

  ThreadFront.timeWarp(point, time, hasFrames, /* force */ true);
  ThreadFront.initializedWaiter.resolve();
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

function onPaused({ time }: PauseEventArgs): UIThunkAction {
  return async ({ dispatch, getState }) => {
    dispatch(setTimelineState({ currentTime: time, playback: null }));

    try {
      const { screen, mouse } = await getGraphicsAtTime(time);

      if (screen && selectors.getCurrentTime(getState()) == time) {
        dispatch(setTimelineState({ screenShot: screen, mouse }));
        paintGraphics(screen, mouse);
      }
    } catch (e) {}
  };
}

function setRecordingDescription({ duration, lastScreen }: RecordingDescription): UIThunkAction {
  return ({ dispatch, getState }) => {
    const zoomRegion = selectors.getZoomRegion(getState());

    // Paint the last screen to get it up quickly, even though we don't know yet
    // which execution point this is and have warped here.
    // paintGraphics(lastScreen);

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
    const el = document.querySelector(".progress-bar");
    const width = el ? el.clientWidth : 1;
    const left = el ? el.getBoundingClientRect().left : 1;
    const top = el ? el.getBoundingClientRect().top : 1;
    dispatch(setTimelineState({ timelineDimensions: { width, left, top } }));
  };
}

export function setTimelineState(state: Partial<TimelineState>): SetTimelineStateAction {
  return { type: "set_timeline_state", state };
}

export function setTimelineToTime(time: number | null, updateGraphics = true): UIThunkAction {
  return async ({ dispatch, getState }) => {
    dispatch(setTimelineState({ hoverTime: time }));

    if (!updateGraphics) {
      return;
    }

    try {
      const screenshotTime = time || selectors.getCurrentTime(getState());
      const { screen, mouse } = await getGraphicsAtTime(screenshotTime);

      if (selectors.getHoverTime(getState()) !== time) {
        return;
      }

      paintGraphics(screen, mouse);
    } catch {}
  };
}

export function setPlaybackStalled(stalled: boolean): SetPlaybackStalledAction {
  console.log("Stalled");
  return { type: "set_playback_stalled", stalled };
}

export function hideTooltip(): UIThunkAction {
  return ({ dispatch }) => {
    dispatch(updateTooltip(null));
    dispatch(setTimelineToTime(null));
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
  hasFrames: boolean,
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

export function seekToTime(targetTime: number): UIThunkAction {
  return ({ dispatch }) => {
    if (targetTime == null) {
      return;
    }

    const event = mostRecentPaintOrMouseEvent(targetTime);

    if (event) {
      // Seek to the exact time provided, even if it does not match up with a
      // paint event. This can cause some slight UI weirdness: resumes done in
      // the debugger will be relative to the point instead of the time,
      // so e.g. running forward could land at a point before the time itself.
      // This could be fixed but doesn't seem worth worrying about for now.
      dispatch(seek(event.point, targetTime, false));
    }
  };
}

export function togglePlayback(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const playback = selectors.getPlayback(getState());

    if (playback) {
      dispatch(stopPlayback());
    } else {
      dispatch(startPlayback());
    }
  };
}

export function startPlayback(): UIThunkAction {
  return ({ dispatch, getState }) => {
    log(`StartPlayback`);

    const state = getState();
    const currentTime = selectors.getCurrentTime(state);
    const { endTime } = selectors.getZoomRegion(state);

    const startDate = Date.now();
    const startTime = currentTime >= endTime ? 0 : currentTime;

    dispatch(
      setTimelineState({
        playback: { startTime, startDate, time: startTime },
        currentTime: startTime,
      })
    );

    dispatch(playback(startTime, endTime));
  };
}

export function stopPlayback(): UIThunkAction {
  return ({ dispatch, getState }) => {
    log(`StopPlayback`);

    const playback = selectors.getPlayback(getState());

    if (playback) {
      dispatch(seekToTime(playback.time));
    }

    dispatch(setTimelineState({ playback: null }));
  };
}

export function replayPlayback(): UIThunkAction {
  return ({ dispatch }) => {
    dispatch(seekToTime(0));
    dispatch(startPlayback());
  };
}

function playback(startTime: number, endTime: number): UIThunkAction {
  return async ({ dispatch, getState }) => {
    let startDate = Date.now();
    let currentDate = startDate;
    let currentTime = startTime;
    let nextGraphicsTime = nextPaintOrMouseEvent(currentTime)?.time || endTime;
    let nextGraphicsPromise = getGraphicsAtTime(nextGraphicsTime, true);

    const prepareNextGraphics = () => {
      nextGraphicsTime = nextPaintOrMouseEvent(currentTime)?.time || endTime;
      nextGraphicsPromise = getGraphicsAtTime(nextGraphicsTime, true);
    };
    const shouldContinuePlayback = () => selectors.getPlayback(getState());
    prepareNextGraphics();

    while (shouldContinuePlayback()) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (!shouldContinuePlayback()) {
        return;
      }

      currentDate = Date.now();
      currentTime = startTime + (currentDate - startDate);

      if (currentTime > endTime) {
        log(`FinishPlayback`);
        dispatch(seekToTime(endTime));
        return dispatch(setTimelineState({ currentTime: endTime, playback: null }));
      }

      dispatch({ type: "RESUME" });
      dispatch(
        setTimelineState({
          currentTime,
          playback: { startTime, startDate, time: currentTime },
        })
      );

      if (currentTime >= nextGraphicsTime) {
        try {
          let maybeNextGraphics = await Promise.race([nextGraphicsPromise, waitForTime(500)]);
          if (!maybeNextGraphics) {
            dispatch(setPlaybackStalled(true));
            maybeNextGraphics = await nextGraphicsPromise;
            dispatch(setPlaybackStalled(false));
          }
          const { screen, mouse } = maybeNextGraphics;

          if (!shouldContinuePlayback()) {
            return;
          }

          // Playback may have stalled waiting for `nextGraphicsPromise` and would jump
          // in the next iteration in order to catch up. To avoid jumps of more than
          // 100 milliseconds, we reset `startTime` and `startDate` as if playback had
          // been started right now.
          if (Date.now() - currentDate > 100) {
            startTime = currentTime;
            startDate = Date.now();
            dispatch(
              setTimelineState({
                currentTime,
                playback: { startTime, startDate, time: currentTime },
              })
            );
          }

          if (screen) {
            paintGraphics(screen, mouse);
          }
        } catch (e) {}

        prepareNextGraphics();
      }
    }
  };
}

export function goToNextPaint(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const currentTime = selectors.getCurrentTime(getState());
    const { startTime } = selectors.getZoomRegion(getState());

    if (currentTime == startTime) {
      return;
    }

    const previous = previousPaintEvent(currentTime);

    if (!previous) {
      return;
    }

    dispatch(seekToTime(Math.max(previous.time, startTime)));
  };
}

export function goToPrevPaint(): UIThunkAction {
  return ({ dispatch, getState }) => {
    const currentTime = selectors.getCurrentTime(getState());
    const { endTime } = selectors.getZoomRegion(getState());

    if (currentTime == endTime) {
      return;
    }

    const next = nextPaintEvent(currentTime);

    if (!next) {
      return;
    }

    dispatch(seekToTime(Math.min(next.time, endTime)));
  };
}

export function setHoveredItem(hoveredItem: HoveredItem): UIThunkAction {
  return ({ dispatch, getState }) => {
    const { target } = hoveredItem;

    const hoverEnabledForTarget = features[`${target}Hover`];
    if (!hoverEnabledForTarget) {
      return;
    }

    dispatch({ type: "set_hovered_item", hoveredItem });

    // Don't update the video if user is adding a new comment.
    const updateGraphics = !selectors.getPendingComment(getState());
    dispatch(setTimelineToTime(hoveredItem?.time || null, updateGraphics));
  };
}

export function clearHoveredItem(): UIThunkAction {
  return ({ dispatch }) => {
    dispatch({ type: "set_hovered_item", hoveredItem: null });
    dispatch(setTimelineToTime(null));
  };
}
