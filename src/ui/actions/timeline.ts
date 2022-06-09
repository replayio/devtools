import { ExecutionPoint, PauseId } from "@replayio/protocol";
import { setBreakpointOptions } from "devtools/client/debugger/src/actions/breakpoints/modify";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { refetchMessages } from "devtools/client/webconsole/actions/messages";
import sortedIndexBy from "lodash/sortedIndexBy";
import sortedLastIndexBy from "lodash/sortedLastIndexBy";
import {
  getGraphicsAtTime,
  gPaintPoints,
  paintGraphics,
  mostRecentIndex,
  mostRecentPaintOrMouseEvent,
  nextPaintOrMouseEvent,
  nextPaintEvent,
  previousPaintEvent,
  getFirstMeaningfulPaint,
  timeIsBeyondKnownPaints,
  screenshotCache,
} from "protocol/graphics";
import { client, log } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { Pause } from "protocol/thread/pause";
import { PauseEventArgs } from "protocol/thread/thread";
import { assert, waitForTime } from "protocol/utils";
import { getFirstComment } from "ui/hooks/comments/comments";
import {
  getCurrentTime,
  getFocusRegion,
  getHoveredItem,
  getHoverTime,
  getPlayback,
  getPlaybackPrecachedTime,
  getRecordingDuration,
  getZoomRegion,
  getShowFocusModeControls,
  setPlaybackPrecachedTime,
  pointsReceived,
} from "ui/reducers/timeline";
import { FocusRegion, HoveredItem } from "ui/state/timeline";
import { getPausePointParams, getTest, updateUrlWithParams } from "ui/utils/environment";
import KeyShortcuts, { isEditableElement } from "ui/utils/key-shortcuts";
import { features } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import { endTimeForFocusRegion, isTimeInRegions, startTimeForFocusRegion } from "ui/utils/timeline";

import {
  setFocusRegion as newFocusRegion,
  setHoveredItem as setHoveredItemAction,
  setPlaybackStalled,
  setTimelineState,
} from "../reducers/timeline";

import { getLoadedRegions } from "./app";
import type { UIStore, UIThunkAction } from "./index";

const DEFAULT_FOCUS_WINDOW_PERCENTAGE = 0.2;
const DEFAULT_FOCUS_WINDOW_MAX_LENGTH = 5000;

export async function setupTimeline(store: UIStore) {
  const dispatch = store.dispatch;

  ThreadFront.on("paused", args => dispatch(onPaused(args)));

  const shortcuts = new KeyShortcuts({
    Left: ev => {
      if (!ev.target || !isEditableElement(ev.target)) {
        store.dispatch(goToPrevPaint());
      }
    },
    Right: ev => {
      if (!ev.target || !isEditableElement(ev.target)) {
        store.dispatch(goToNextPaint());
      }
    },
    Space: ev => {
      if (!ev.target || !isEditableElement(ev.target)) {
        store.dispatch(togglePlayback());
      }
    },
  });
  shortcuts.attach(window.document);
}

export function jumpToInitialPausePoint(): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    assert(ThreadFront.recordingId, "no recordingId");

    await ThreadFront.waitForSession();
    const { duration } = await ThreadFront.getRecordingDescription();
    dispatch(setRecordingDescription(duration));

    const { endpoint } = await client.Session.getEndpoint({}, ThreadFront.sessionId!);
    dispatch(pointsReceived([endpoint]));
    let { point, time } = endpoint;

    const state = getState();
    const zoomRegion = getZoomRegion(state);
    const newZoomRegion = { ...zoomRegion, endTime: time };
    dispatch(
      setTimelineState({ currentTime: time, recordingDuration: time, zoomRegion: newZoomRegion })
    );

    let hasFrames = false;
    const initialPausePoint = await getInitialPausePoint(ThreadFront.recordingId);
    if (
      initialPausePoint &&
      isTimeInRegions(initialPausePoint.time, getLoadedRegions(state)!.loading)
    ) {
      point = initialPausePoint.point;
      hasFrames = initialPausePoint.hasFrames;
      time = initialPausePoint.time;
    }

    ThreadFront.timeWarp(point, time, hasFrames);
    ThreadFront.initializedWaiter.resolve();
  };
}

async function getInitialPausePoint(recordingId: string) {
  let hasFrames = false;
  if (getTest()) {
    return;
  }

  const pausePointParams = getPausePointParams();
  if (pausePointParams) {
    return pausePointParams;
  }

  const firstComment = await getFirstComment(recordingId);
  if (firstComment) {
    const { point, time } = firstComment;
    hasFrames = firstComment.hasFrames;
    return { point, time, hasFrames };
  }

  const firstMeaningfulPaint = await getFirstMeaningfulPaint(10);
  if (firstMeaningfulPaint) {
    const { point, time } = firstMeaningfulPaint;
    return { point, time, hasFrames: false };
  }
}

function onPaused({ point, time, hasFrames }: PauseEventArgs): UIThunkAction {
  return async dispatch => {
    updatePausePointParams({ point, time, hasFrames });
    dispatch(setTimelineState({ currentTime: time, playback: null }));
  };
}

function setRecordingDescription(duration: number): UIThunkAction {
  return (dispatch, getState) => {
    const zoomRegion = getZoomRegion(getState());

    dispatch(
      setTimelineState({
        recordingDuration: duration,
        currentTime: duration,
        zoomRegion: { ...zoomRegion, endTime: duration },
      })
    );
  };
}

export function setTimelineToTime(time: number | null, updateGraphics = true): UIThunkAction {
  return async (dispatch, getState) => {
    dispatch(setTimelineState({ hoverTime: time }));

    if (!updateGraphics) {
      return;
    }

    const stateBeforeScreenshot = getState();

    try {
      const currentTime = getCurrentTime(stateBeforeScreenshot);
      const screenshotTime = time || currentTime;
      const { screen, mouse } = await getGraphicsAtTime(screenshotTime);
      const stateAfterScreenshot = getState();

      if (getHoverTime(stateAfterScreenshot) !== time) {
        return;
      }

      paintGraphics(screen, mouse);
    } catch (error) {
      console.error(error);
    }
  };
}

function updatePausePointParams({
  point,
  time,
  hasFrames,
}: {
  point: ExecutionPoint;
  time: number;
  hasFrames: boolean;
}) {
  const params = { point, time: `${time}`, hasFrames: `${hasFrames}` };
  updateUrlWithParams(params);
}

export function seek(
  point: ExecutionPoint,
  time: number,
  hasFrames: boolean,
  pauseId?: PauseId
): UIThunkAction<boolean> {
  return (dispatch, getState, { ThreadFront }) => {
    const pause = pauseId !== undefined ? Pause.getById(pauseId) : undefined;
    dispatch({ type: "CLEAR_FRAME_POSITIONS" });
    if (pause) {
      ThreadFront.timeWarpToPause(pause);
    } else {
      const regions = getLoadedRegions(getState());
      const isTimeInLoadedRegion = regions !== null && isTimeInRegions(time, regions.loaded);
      if (isTimeInLoadedRegion) {
        ThreadFront.timeWarp(point, time, hasFrames);
      } else {
        // We can't time-wrap in this case because trying to pause outside of a loaded region will throw.
        // In this case the best we can do is update the current time and the "video" frame.
        dispatch(setTimelineState({ currentTime: time }));
        dispatch(setTimelineToTime(time, true));
      }
    }
    return true;
  };
}

export function seekToTime(targetTime: number): UIThunkAction {
  return async (dispatch, _getState, { ThreadFront }) => {
    if (targetTime == null) {
      return;
    }

    const nearestEvent = mostRecentPaintOrMouseEvent(targetTime) || { point: "", time: Infinity };
    const pointNearTime = (
      await client.Session.getPointNearTime({ time: targetTime }, ThreadFront.sessionId!)
    ).point;

    if (Math.abs(pointNearTime.time - targetTime) > Math.abs(nearestEvent.time - targetTime)) {
      dispatch(seek(nearestEvent.point, targetTime, false));
    } else {
      // I would prefer that we also use pointNearTime.time here, for accuracy,
      // but it would be super annoying when it is off. Maybe when we have a
      // more exact method.
      dispatch(seek(pointNearTime.point, targetTime, false));
    }
  };
}

export function togglePlayback(): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const playback = getPlayback(state);
    const currentTime = getCurrentTime(state);

    if (playback || timeIsBeyondKnownPaints(currentTime)) {
      dispatch(stopPlayback());
    } else {
      dispatch(startPlayback());
    }
  };
}

export function startPlayback(): UIThunkAction {
  return (dispatch, getState) => {
    log(`StartPlayback`);

    const state = getState();
    const currentTime = getCurrentTime(state);

    if (timeIsBeyondKnownPaints(currentTime)) {
      return;
    }

    const endTime = getZoomRegion(state).endTime;

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
  return (dispatch, getState) => {
    log(`StopPlayback`);

    const playback = getPlayback(getState());

    if (playback) {
      dispatch(seekToTime(playback.time));
    }

    dispatch(setTimelineState({ playback: null }));
  };
}

export function replayPlayback(): UIThunkAction {
  return (dispatch, getState) => {
    const startTime = 0;

    dispatch(seekToTime(startTime));
    dispatch(startPlayback());
  };
}

function playback(startTime: number, endTime: number): UIThunkAction {
  return async (dispatch, getState) => {
    let startDate = Date.now();
    let currentDate = startDate;
    let currentTime = startTime;
    let nextGraphicsTime!: number;
    let nextGraphicsPromise!: ReturnType<typeof getGraphicsAtTime>;

    const prepareNextGraphics = () => {
      nextGraphicsTime = snapTimeForPlayback(nextPaintOrMouseEvent(currentTime)?.time || endTime);
      nextGraphicsPromise = getGraphicsAtTime(nextGraphicsTime, true);
      dispatch(precacheScreenshots(nextGraphicsTime));
    };
    const shouldContinuePlayback = () => getPlayback(getState());
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

          paintGraphics(screen, mouse);
        } catch (e) {}

        prepareNextGraphics();
      }
    }
  };
}

export function goToPrevPaint(): UIThunkAction {
  return (dispatch, getState) => {
    const currentTime = getCurrentTime(getState());
    const { startTime } = getZoomRegion(getState());

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

export function goToNextPaint(): UIThunkAction {
  return (dispatch, getState) => {
    const currentTime = getCurrentTime(getState());
    const { endTime } = getZoomRegion(getState());

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
  return dispatch => {
    const { target } = hoveredItem;

    const hoverEnabledForTarget = (features as any)[`${target}Hover`];
    if (!hoverEnabledForTarget) {
      return;
    }

    dispatch(setHoveredItemAction(hoveredItem));

    dispatch(setTimelineToTime(hoveredItem?.time || null));
  };
}

export function clearHoveredItem(): UIThunkAction {
  return (dispatch, getState) => {
    const hoveredItem = getHoveredItem(getState());
    if (!hoveredItem) {
      return;
    }
    dispatch(setHoveredItemAction(null));
    dispatch(setTimelineToTime(null));
  };
}

export function setFocusRegion(
  focusRegion: { startTime: number; endTime: number } | null
): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const currentTime = getCurrentTime(state);

    // Stop playback (if we're playing) to avoid the currentTime from getting out of bounds.
    const playback = getPlayback(state);
    if (playback !== null) {
      dispatch(stopPlayback());
    }

    if (focusRegion !== null) {
      const zoomRegion = getZoomRegion(state);
      const previousFocusRegion = getFocusRegion(state);
      const prevStartTime = previousFocusRegion
        ? startTimeForFocusRegion(previousFocusRegion)
        : undefined;
      const prevEndTime = previousFocusRegion
        ? endTimeForFocusRegion(previousFocusRegion)
        : undefined;

      let { endTime, startTime } = focusRegion;

      // Basic bounds check.
      if (startTime < zoomRegion.startTime) {
        startTime = zoomRegion.startTime;
      }
      if (endTime > zoomRegion.endTime) {
        endTime = zoomRegion.endTime;
      }

      // Make sure our region is valid.
      if (endTime < startTime) {
        // If we need to adjust a dimension, it's the most intuitive to adjust the one that's being updated.
        if (prevEndTime === endTime) {
          startTime = endTime;
        } else {
          endTime = startTime;
        }
      }

      // Update the previous to match the handle that's being dragged.
      if (startTime !== prevStartTime && endTime === prevEndTime) {
        dispatch(setTimelineToTime(startTime));
      } else if (startTime === prevStartTime && endTime !== prevEndTime) {
        dispatch(setTimelineToTime(endTime));
      } else {
        // Else just make sure the preview time stays within the moving window.
        const hoverTime = getHoverTime(state);
        if (hoverTime !== null) {
          if (hoverTime < startTime) {
            dispatch(setTimelineToTime(startTime));
          } else if (hoverTime > endTime) {
            dispatch(setTimelineToTime(endTime));
          }
        } else {
          dispatch(setTimelineToTime(currentTime));
        }
      }

      // We now try and create a focus region with a time and a point, from just a
      // time. In the future, it would be better if this were something like
      // "setFocusRegionByTime" and we had another method which accepted
      // TimeStampedPoints, because setting via context menu will often happen on
      // resources where we already know the time *and* point. Also, we probably
      // should *not* do this on every mouse movement in focus mode. This is
      // actually foregoing most of the `getPointNearTime`, and instead relying on
      // points that we mostly have already. I think often this will be OK, but
      // probably we should also run "getPointNearTime", store that, and take the
      // closest thing we can find of the points we have (assuming we don't have
      // an exact match.)
      const startIndex = sortedLastIndexBy(
        state.timeline.points,
        { time: startTime, point: "" },
        p => p.time
      );
      const start =
        startIndex > 0 ? state.timeline.points[startIndex - 1] : { point: "0", time: 0 };

      const endIndex = sortedIndexBy(
        state.timeline.points,
        { time: endTime, point: "" },
        p => p.time
      );
      const end =
        endIndex > 0 && endIndex < state.timeline.points.length
          ? state.timeline.points[endIndex]
          : { point: "", time: endTime };

      dispatch(
        newFocusRegion({
          start,
          startTime,
          end,
          endTime,
        })
      );
    } else {
      dispatch(newFocusRegion(null));
    }
  };
}

export function setFocusRegionEndTime(endTime: number, sync: boolean): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const focusRegion = getFocusRegion(state);

    // If this is the first time the user is focusing, start at the beginning of the recording (or zoom region).
    // Let the focus action/reducer will handle cropping for us.
    const startTime = focusRegion ? startTimeForFocusRegion(focusRegion) : 0;

    dispatch(
      setFocusRegion({
        endTime,
        startTime,
      })
    );

    if (sync) {
      dispatch(syncFocusedRegion());
    }
  };
}

export function setFocusRegionStartTime(startTime: number, sync: boolean): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const focusRegion = getFocusRegion(state);

    // If this is the first time the user is focusing, extend to the end of the recording (or zoom region).
    // Let the focus action/reducer will handle cropping for us.
    const endTime = focusRegion ? endTimeForFocusRegion(focusRegion) : Number.POSITIVE_INFINITY;

    dispatch(
      setFocusRegion({
        endTime,
        startTime,
      })
    );

    if (sync) {
      dispatch(syncFocusedRegion());
    }
  };
}

export function syncFocusedRegion(): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const state = getState();
    const zoomRegion = getZoomRegion(state);
    const focusRegion = getFocusRegion(state) as FocusRegion;

    if (!focusRegion) {
      return;
    }

    if (!features.softFocus) {
      client.Session.unloadRegion(
        { region: { begin: 0, end: startTimeForFocusRegion(focusRegion) } },
        ThreadFront.sessionId!
      );
      client.Session.unloadRegion(
        { region: { begin: endTimeForFocusRegion(focusRegion), end: zoomRegion.endTime } },
        ThreadFront.sessionId!
      );
    }

    client.Session.loadRegion(
      {
        region: {
          begin: startTimeForFocusRegion(focusRegion),
          end: endTimeForFocusRegion(focusRegion),
        },
      },
      ThreadFront.sessionId!
    );

    const breakpoints = state.breakpoints.breakpoints;
    const cx = getThreadContext(state);
    for (const b of Object.values(breakpoints)) {
      // Prod all breakpoints to refetch
      dispatch(setBreakpointOptions(cx, b.location as any, b.options));
    }
    await dispatch(refetchMessages(focusRegion));
  };
}

export function enterFocusMode(): UIThunkAction {
  return (dispatch, getState) => {
    trackEvent("timeline.start_focus_edit");

    const state = getState();
    const currentTime = getCurrentTime(state);
    const focusRegion = getFocusRegion(state);

    dispatch(
      setTimelineState({
        focusRegionBackup: focusRegion,
        showFocusModeControls: true,
      })
    );

    if (!focusRegion) {
      const zoomRegion = getZoomRegion(state);

      const focusWindowSize = Math.min(
        (zoomRegion.endTime - zoomRegion.startTime) * DEFAULT_FOCUS_WINDOW_PERCENTAGE,
        DEFAULT_FOCUS_WINDOW_MAX_LENGTH
      );

      const startTime = Math.max(zoomRegion.startTime, currentTime - focusWindowSize / 2);
      const endTime = Math.min(zoomRegion.endTime, currentTime + focusWindowSize / 2);

      dispatch(setFocusRegion({ endTime, startTime }));
    }
  };
}

export function exitFocusMode(): UIThunkAction {
  return dispatch => {
    trackEvent("timeline.exit_focus_edit");
    dispatch(
      setTimelineState({
        showFocusModeControls: false,
      })
    );
  };
}

export function toggleFocusMode(): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const showFocusModeControls = getShowFocusModeControls(state);
    if (showFocusModeControls) {
      dispatch(exitFocusMode());
    } else {
      dispatch(enterFocusMode());
    }
  };
}

const PRECACHE_DURATION: number = 5000;

let precacheStartTime: number = -1;

export function precacheScreenshots(startTime: number): UIThunkAction {
  return async (dispatch, getState) => {
    const recordingDuration = getRecordingDuration(getState());
    if (!recordingDuration) {
      return;
    }

    startTime = snapTimeForPlayback(startTime);
    if (startTime === precacheStartTime) {
      return;
    }
    if (startTime < precacheStartTime) {
      dispatch(setPlaybackPrecachedTime(startTime));
    }
    precacheStartTime = startTime;

    const endTime = Math.min(startTime + PRECACHE_DURATION, recordingDuration);
    for (let time = startTime; time < endTime; time += SNAP_TIME_INTERVAL) {
      const index = mostRecentIndex(gPaintPoints, time);
      if (index === undefined) {
        return;
      }

      const paintHash = gPaintPoints[index].paintHash;
      if (!screenshotCache.hasScreenshot(paintHash)) {
        const graphicsPromise = getGraphicsAtTime(time, true);

        const precachedTime = Math.max(time - SNAP_TIME_INTERVAL, startTime);
        if (precachedTime > getPlaybackPrecachedTime(getState())) {
          dispatch(setPlaybackPrecachedTime(precachedTime));
        }

        await graphicsPromise;

        if (precacheStartTime !== startTime) {
          return;
        }
      }
    }

    let precachedTime = endTime;
    if (mostRecentIndex(gPaintPoints, precachedTime) === gPaintPoints.length - 1) {
      precachedTime = recordingDuration;
    }
    if (precachedTime > getPlaybackPrecachedTime(getState())) {
      dispatch(setPlaybackPrecachedTime(precachedTime));
    }
  };
}

const SNAP_TIME_INTERVAL = 50;

// Snap time to 50ms intervals, snapping up.
function snapTimeForPlayback(time: number) {
  return time + SNAP_TIME_INTERVAL - (time % SNAP_TIME_INTERVAL);
}
