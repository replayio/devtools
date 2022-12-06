import { ExecutionPoint, PauseId } from "@replayio/protocol";
import sortedIndexBy from "lodash/sortedIndexBy";
import sortedLastIndexBy from "lodash/sortedLastIndexBy";

import { framePositionsCleared, resumed } from "devtools/client/debugger/src/reducers/pause";
import {
  gPaintPoints,
  getFirstMeaningfulPaint,
  getGraphicsAtTime,
  mostRecentIndex,
  mostRecentPaintOrMouseEvent,
  nextPaintEvent,
  nextPaintOrMouseEvent,
  paintGraphics,
  previousPaintEvent,
  repaintAtPause,
  screenshotCache,
  timeIsBeyondKnownPaints,
} from "protocol/graphics";
import { DownloadCancelledError } from "protocol/screenshot-cache";
import { ThreadFront } from "protocol/thread";
import { PauseEventArgs } from "protocol/thread/thread";
import { waitForTime } from "protocol/utils";
import { getFirstComment } from "ui/hooks/comments/comments";
import { setSelectedTest } from "ui/reducers/reporter";
import {
  getCurrentTime,
  getFocusRegion,
  getHoverTime,
  getHoveredItem,
  getPlayback,
  getPlaybackPrecachedTime,
  getRecordingDuration,
  getShowFocusModeControls,
  getZoomRegion,
  pointsReceivedThunk,
  setPlaybackPrecachedTime,
} from "ui/reducers/timeline";
import { FocusRegion, HoveredItem, PlaybackOptions } from "ui/state/timeline";
import {
  encodeObjectToURL,
  getPausePointParams,
  getTest,
  updateUrlWithParams,
} from "ui/utils/environment";
import KeyShortcuts, { isEditableElement } from "ui/utils/key-shortcuts";
import { features } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";
import {
  displayedBeginForFocusRegion,
  displayedEndForFocusRegion,
  isTimeInRegions,
  rangeForFocusRegion,
} from "ui/utils/timeline";

import {
  setFocusRegion as newFocusRegion,
  setHoveredItem as setHoveredItemAction,
  setPlaybackStalled,
  setTimelineState,
} from "../reducers/timeline";
import { getLoadedRegions, isPointInLoadingRegion } from "./app";
import type { UIStore, UIThunkAction } from "./index";

const DEFAULT_FOCUS_WINDOW_PERCENTAGE = 0.2;
const DEFAULT_FOCUS_WINDOW_MAX_LENGTH = 5000;
export const MAX_FOCUS_REGION_DURATION = 60_000;

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
  return async (dispatch, getState, { ThreadFront, replayClient }) => {
    const endpoint = await replayClient.getSessionEndpoint(replayClient.getSessionId()!);
    dispatch(pointsReceivedThunk([endpoint]));
    let { point, time } = endpoint;

    const state = getState();
    const zoomRegion = getZoomRegion(state);
    const newZoomRegion = { ...zoomRegion, endTime: time };
    dispatch(
      setTimelineState({ currentTime: time, recordingDuration: time, zoomRegion: newZoomRegion })
    );

    const initialPausePoint = await getInitialPausePoint(ThreadFront.recordingId!);

    if (initialPausePoint) {
      const focusRegion =
        "focusRegion" in initialPausePoint ? initialPausePoint.focusRegion : undefined;
      if (focusRegion) {
        dispatch(
          newFocusRegion({
            ...focusRegion,
            beginTime: focusRegion.begin.time,
            endTime: focusRegion.end.time,
          })
        );
        dispatch(syncFocusedRegion());
      }

      const testIndex = "testIndex" in initialPausePoint ? initialPausePoint.testIndex : undefined;
      if (testIndex) {
        dispatch(setSelectedTest(testIndex));
      }

      point = initialPausePoint.point;
      time = initialPausePoint.time;
    }
    if (isPointInLoadingRegion(state, point)) {
      ThreadFront.timeWarp(point, time, false);
    }
  };
}

async function getInitialPausePoint(recordingId: string) {
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
    return { point, time };
  }

  const firstMeaningfulPaint = await getFirstMeaningfulPaint(10);
  if (firstMeaningfulPaint) {
    const { point, time } = firstMeaningfulPaint;
    return { point, time };
  }
}

function onPaused({ point, time }: PauseEventArgs): UIThunkAction {
  return async (dispatch, getState) => {
    const focusRegion = getFocusRegion(getState());
    const params: Omit<PauseEventArgs, "openSource"> & { focusRegion: FocusRegion | null } = {
      focusRegion,
      point,
      time,
    };
    updatePausePointParams(params);
    dispatch(setTimelineState({ currentTime: time, playback: null }));
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
      if (!(error instanceof DownloadCancelledError)) {
        console.error(error);
      }
    }
  };
}

export function setTimelineToPauseTime(
  time: number,
  pauseId: string,
  point?: string,
  force = false
): UIThunkAction {
  return async (dispatch, getState) => {
    dispatch(setTimelineToTime(time));

    if (time) {
      repaintAtPause(time, pauseId, time => getHoverTime(getState()) !== time, force, point);
    }
  };
}

export function updatePausePointParams({
  point,
  time,
  focusRegion,
}: {
  point: ExecutionPoint;
  time: number;
  focusRegion: FocusRegion | null;
}) {
  const params: { point: string; time: string; focusRegion?: string } = {
    point,
    time: `${time}`,
    focusRegion: encodeFocusRegion(focusRegion),
  };
  updateUrlWithParams(params);
}

export function updateFocusRegionParam(): UIThunkAction<void> {
  return (dispatch, getState) => {
    const focusRegion = getFocusRegion(getState());
    updateUrlWithParams({ focusRegion: encodeFocusRegion(focusRegion) });
  };
}

function encodeFocusRegion(focusRegion: FocusRegion | null) {
  return focusRegion ? encodeObjectToURL(rangeForFocusRegion(focusRegion)) : undefined;
}

export function seek(
  point: ExecutionPoint,
  time: number,
  openSource: boolean,
  pauseId?: PauseId
): UIThunkAction<boolean> {
  return (dispatch, getState, { ThreadFront }) => {
    dispatch(framePositionsCleared());
    if (pauseId) {
      ThreadFront.timeWarpToPause({ point, time, pauseId }, openSource);
    } else {
      const regions = getLoadedRegions(getState());
      const focusRegion = getFocusRegion(getState());
      const isTimeInLoadedRegion = regions !== null && isTimeInRegions(time, regions.loaded);
      if (isTimeInLoadedRegion) {
        ThreadFront.timeWarp(point, time, openSource);
      } else {
        // We can't time-wrap in this case because trying to pause outside of a loaded region will throw.
        // In this case the best we can do is update the current time and the "video" frame.
        dispatch(setTimelineState({ currentTime: time }));
        dispatch(setTimelineToTime(time, true));
        updatePausePointParams({ point, time, focusRegion });
      }
    }
    return true;
  };
}

export function seekToTime(targetTime: number, autoPlay?: boolean): UIThunkAction {
  return async (dispatch, _, { replayClient }) => {
    if (targetTime == null) {
      return;
    }

    // getPointNearTime could take time while we're processing the recording
    // so we optimistically set the timeline to the target time
    dispatch(setTimelineToTime(targetTime));

    const nearestEvent = mostRecentPaintOrMouseEvent(targetTime) || { point: "", time: Infinity };
    let bestPoint = nearestEvent;
    const { point } = await replayClient.getPointNearTime(targetTime);
    if (Math.abs(point.time - targetTime) < Math.abs(nearestEvent.time - targetTime)) {
      bestPoint = point;
    }

    dispatch(seek(bestPoint.point, targetTime, false));

    if (autoPlay) {
      dispatch(startPlayback());
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

export function startPlayback(
  { beginTime: optBeginTime, endTime: optEndTime }: PlaybackOptions = {
    beginTime: null,
    endTime: null,
  }
): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const currentTime = getCurrentTime(state);

    if (timeIsBeyondKnownPaints(currentTime)) {
      return;
    }

    const endTime = optEndTime || getZoomRegion(state).endTime;

    const beginDate = Date.now();
    const beginTime = optBeginTime || (currentTime >= endTime ? 0 : currentTime);

    dispatch(
      setTimelineState({
        playback: { beginTime, beginDate, time: beginTime },
        currentTime: beginTime,
      })
    );

    dispatch(playback(beginTime, endTime));
  };
}

export function stopPlayback(updateTime: boolean = true): UIThunkAction {
  return async (dispatch, getState) => {
    if (updateTime) {
      const playback = getPlayback(getState());

      if (playback) {
        dispatch(seekToTime(playback.time));
      }
    }

    dispatch(setTimelineState({ playback: null }));
  };
}

export function replayPlayback(): UIThunkAction {
  return (dispatch, getState) => {
    const beginTime = 0;

    dispatch(seekToTime(beginTime));
    dispatch(startPlayback());
  };
}

export function playback(beginTime: number, endTime: number): UIThunkAction {
  return async (dispatch, getState) => {
    let beginDate = Date.now();
    let currentDate = beginDate;
    let currentTime = beginTime;
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
      currentTime = beginTime + (currentDate - beginDate);

      if (currentTime > endTime) {
        dispatch(seekToTime(endTime));
        return dispatch(setTimelineState({ currentTime: endTime, playback: null }));
      }

      dispatch(resumed());
      dispatch(
        setTimelineState({
          currentTime,
          playback: { beginTime, beginDate, time: currentTime },
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
          // 100 milliseconds, we reset `beginTime` and `beginDate` as if playback had
          // begun right now.
          if (Date.now() - currentDate > 100) {
            beginTime = currentTime;
            beginDate = Date.now();
            dispatch(
              setTimelineState({
                currentTime,
                playback: { beginTime, beginDate, time: currentTime },
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
    const { beginTime: beginTime } = getZoomRegion(getState());

    if (currentTime == beginTime) {
      return;
    }

    const previous = previousPaintEvent(currentTime);

    if (!previous) {
      return;
    }

    dispatch(seekToTime(Math.max(previous.time, beginTime)));
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
  focusRegion: { beginTime: number; endTime: number } | null
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
      const prevBeginTime = previousFocusRegion
        ? displayedBeginForFocusRegion(previousFocusRegion)
        : undefined;
      const prevEndTime = previousFocusRegion
        ? displayedEndForFocusRegion(previousFocusRegion)
        : undefined;

      let { endTime, beginTime } = focusRegion;

      // Basic bounds check.
      if (beginTime < zoomRegion.beginTime) {
        beginTime = zoomRegion.beginTime;
      }
      if (endTime > zoomRegion.endTime) {
        endTime = zoomRegion.endTime;
      }

      // Make sure our region is valid.
      if (endTime < beginTime) {
        // If we need to adjust a dimension, it's the most intuitive to adjust the one that's being updated.
        if (prevEndTime === endTime) {
          beginTime = endTime;
        } else {
          endTime = beginTime;
        }
      }

      // Cap time to fit within max focus region size.
      if (endTime === prevEndTime) {
        endTime = Math.min(endTime, beginTime + MAX_FOCUS_REGION_DURATION);
      } else {
        beginTime = Math.max(beginTime, endTime - MAX_FOCUS_REGION_DURATION);
      }

      // Update the previous to match the handle that's being dragged.
      if (beginTime !== prevBeginTime && endTime === prevEndTime) {
        dispatch(setTimelineToTime(beginTime));
      } else if (beginTime === prevBeginTime && endTime !== prevEndTime) {
        dispatch(setTimelineToTime(endTime));
      } else {
        // Else just make sure the preview time stays within the moving window.
        const hoverTime = getHoverTime(state);
        if (hoverTime !== null) {
          if (hoverTime < beginTime) {
            dispatch(setTimelineToTime(beginTime));
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
      const beginIndex = sortedLastIndexBy(
        state.timeline.points,
        { time: beginTime, point: "" },
        p => p.time
      );
      const begin =
        beginIndex > 0 ? state.timeline.points[beginIndex - 1] : { point: "0", time: 0 };

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
          begin,
          beginTime,
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

    // If this is the first time the user is focusing, begin at the beginning of the recording (or zoom region).
    // Let the focus action/reducer will handle cropping for us.
    const beginTime = focusRegion ? displayedBeginForFocusRegion(focusRegion) : 0;

    dispatch(
      setFocusRegion({
        endTime,
        beginTime,
      })
    );

    if (sync) {
      dispatch(syncFocusedRegion());
      dispatch(updateFocusRegionParam());
    }
  };
}

export function setFocusRegionBeginTime(beginTime: number, sync: boolean): UIThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const focusRegion = getFocusRegion(state);

    // If this is the first time the user is focusing, extend to the end of the recording (or zoom region).
    // Let the focus action/reducer will handle cropping for us.
    const endTime = focusRegion
      ? displayedEndForFocusRegion(focusRegion)
      : Number.POSITIVE_INFINITY;

    dispatch(
      setFocusRegion({
        endTime,
        beginTime,
      })
    );

    if (sync) {
      dispatch(syncFocusedRegion());
      dispatch(updateFocusRegionParam());
    }
  };
}

export function syncFocusedRegion(): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const state = getState();
    const focusRegion = getFocusRegion(state) as FocusRegion;
    const zoomTime = getZoomRegion(state);

    if (!focusRegion) {
      return;
    }

    replayClient.loadRegion(
      {
        begin: displayedBeginForFocusRegion(focusRegion),
        end: displayedEndForFocusRegion(focusRegion),
      },
      zoomTime.endTime
    );
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
        (zoomRegion.endTime - zoomRegion.beginTime) * DEFAULT_FOCUS_WINDOW_PERCENTAGE,
        DEFAULT_FOCUS_WINDOW_MAX_LENGTH
      );

      const beginTime = Math.max(zoomRegion.beginTime, currentTime - focusWindowSize / 2);
      const endTime = Math.min(zoomRegion.endTime, currentTime + focusWindowSize / 2);

      dispatch(setFocusRegion({ endTime, beginTime }));
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

let precacheBeginTime: number = -1;

export function precacheScreenshots(beginTime: number): UIThunkAction {
  return async (dispatch, getState) => {
    const recordingDuration = getRecordingDuration(getState());
    if (!recordingDuration) {
      return;
    }

    beginTime = snapTimeForPlayback(beginTime);
    if (beginTime === precacheBeginTime) {
      return;
    }
    if (beginTime < precacheBeginTime) {
      dispatch(setPlaybackPrecachedTime(beginTime));
    }
    precacheBeginTime = beginTime;

    const endTime = Math.min(beginTime + PRECACHE_DURATION, recordingDuration);
    for (let time = beginTime; time < endTime; time += SNAP_TIME_INTERVAL) {
      const index = mostRecentIndex(gPaintPoints, time);
      if (index === undefined) {
        return;
      }

      const paintHash = gPaintPoints[index].paintHash;
      if (!screenshotCache.hasScreenshot(paintHash)) {
        const graphicsPromise = getGraphicsAtTime(time, true);

        const precachedTime = Math.max(time - SNAP_TIME_INTERVAL, beginTime);
        if (precachedTime > getPlaybackPrecachedTime(getState())) {
          dispatch(setPlaybackPrecachedTime(precachedTime));
        }

        await graphicsPromise;

        if (precacheBeginTime !== beginTime) {
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
