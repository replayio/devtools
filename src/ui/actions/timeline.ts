import { ExecutionPoint, PauseId, TimeStampedPointRange } from "@replayio/protocol";
import { setBreakpointOptions } from "devtools/client/debugger/src/actions/breakpoints/modify";
import { Breakpoint, getThreadContext } from "devtools/client/debugger/src/selectors";
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
import { DownloadCancelledError } from "protocol/screenshot-cache";
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
  getAnalysisMappingForLocation,
  getStatusFlagsForAnalysisEntry,
} from "devtools/client/debugger/src/selectors";
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

import { getLoadedRegions } from "./app";
import type { UIStore, UIThunkAction } from "./index";
import { UIState } from "ui/state";

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
    const { endpoint } = await ThreadFront.getEndpoint();
    dispatch(pointsReceived([endpoint]));
    let { point, time } = endpoint;

    const state = getState();
    const zoomRegion = getZoomRegion(state);
    const newZoomRegion = { ...zoomRegion, endTime: time };
    dispatch(
      setTimelineState({ currentTime: time, recordingDuration: time, zoomRegion: newZoomRegion })
    );

    let hasFrames = false;

    const initialPausePoint = await getInitialPausePoint(ThreadFront.recordingId!);

    if (initialPausePoint) {
      const range = (initialPausePoint as any).focusRegion;
      if (range) {
        dispatch(setFocusRegionBeginTime(range.begin.time, false));
        dispatch(setFocusRegionEndTime(range.end.time, true));
      }
      point = initialPausePoint.point;
      hasFrames = initialPausePoint.hasFrames;
      time = initialPausePoint.time;
    }
    ThreadFront.timeWarp(point, time, hasFrames);
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
  return async (dispatch, getState) => {
    const focusRegion = getFocusRegion(getState());
    const params: PauseEventArgs & { focusRegion: FocusRegion | null } = {
      focusRegion,
      hasFrames,
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

function updatePausePointParams({
  point,
  time,
  hasFrames,
  focusRegion,
}: {
  point: ExecutionPoint;
  time: number;
  hasFrames: boolean;
  focusRegion: FocusRegion | null;
}) {
  const params: { point: string; time: string; hasFrames: string; focusRegion?: string } = {
    point,
    time: `${time}`,
    hasFrames: `${hasFrames}`,
    focusRegion: undefined,
  };
  if (focusRegion) {
    params.focusRegion = encodeObjectToURL(rangeForFocusRegion(focusRegion));
  }
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

    // getPointNearTime could take time while we're processing the recording
    // so we optimistically set the timeline to the target time
    dispatch(setTimelineToTime(targetTime));

    const nearestEvent = mostRecentPaintOrMouseEvent(targetTime) || { point: "", time: Infinity };
    let bestPoint = nearestEvent;
    try {
      const pointNearTime = await ThreadFront.getPointNearTime(targetTime);
      if (Math.abs(pointNearTime.time - targetTime) < Math.abs(nearestEvent.time - targetTime)) {
        bestPoint = pointNearTime;
      }
    } catch (e) {}
    dispatch(seek(bestPoint.point, targetTime, false));
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
    const state = getState();
    const currentTime = getCurrentTime(state);

    if (timeIsBeyondKnownPaints(currentTime)) {
      return;
    }

    const endTime = getZoomRegion(state).endTime;

    const beginDate = Date.now();
    const beginTime = currentTime >= endTime ? 0 : currentTime;

    dispatch(
      setTimelineState({
        playback: { beginTime, beginDate, time: beginTime },
        currentTime: beginTime,
      })
    );

    dispatch(playback(beginTime, endTime));
  };
}

export function stopPlayback(): UIThunkAction {
  return (dispatch, getState) => {
    const playback = getPlayback(getState());

    if (playback) {
      dispatch(seekToTime(playback.time));
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

function playback(beginTime: number, endTime: number): UIThunkAction {
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

      dispatch({ type: "RESUME" });
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
    }
  };
}

const shouldRerunAnalysisForBreakpoint = (
  state: UIState,
  bp: Breakpoint,
  focusRegion: FocusRegion
): boolean => {
  // Copy-pasted-tweaked comment from actions/messages.ts:
  // Soft Focus: The frontend only needs to refetch data if:
  // 1. The most recent time it requested data "overflowed" (too many hits to send them all), or
  // 2. The new focus region is outside of the most recent region we ran breakpoint analysis for.
  //
  // There are two things to note about the second bullet point above:
  // 1. When devtools is first opened, there is no focused region.
  //    This is equivalent to focusing on the entire timeline, so we often won't need to refetch messages when focusing for the first time.
  // 2. We shouldn't compare the new focus region to the most recent focus region,
  //    but rather to the most recent focus region that we ran breakpoint analysis for (the entire timeline in many cases).
  //    If we don't need to re-run analysis after zooming in, then we won't need to refetch after zooming back out either,
  //    (unless our fetches have overflowed at some point).

  const mappingEntry = getAnalysisMappingForLocation(state, bp.location);
  if (!mappingEntry) {
    return true;
  }

  const { analyses } = state.breakpoints;

  const latestAnalysisEntry = analyses.entities[mappingEntry.currentAnalysis!];

  if (!latestAnalysisEntry) {
    return true;
  }

  const {
    analysisLoaded,
    analysisErrored,
    isFocusSubset,
    analysisOverflowed,
    hasAllDataForFocusRegion,
  } = getStatusFlagsForAnalysisEntry(latestAnalysisEntry, focusRegion);

  return !hasAllDataForFocusRegion;
};

export function syncFocusedRegion(): UIThunkAction {
  return async (dispatch, getState, { ThreadFront }) => {
    const state = getState();
    const focusRegion = getFocusRegion(state) as FocusRegion;
    const zoomTime = getZoomRegion(state);

    if (!focusRegion) {
      return;
    }

    ThreadFront.loadRegion(
      {
        begin: displayedBeginForFocusRegion(focusRegion),
        end: displayedEndForFocusRegion(focusRegion),
      },
      zoomTime.endTime
    );

    const { breakpoints } = state.breakpoints;
    const cx = getThreadContext(state);
    for (const b of Object.values(breakpoints)) {
      const rerunAnalysisForBreakpoint = shouldRerunAnalysisForBreakpoint(state, b, focusRegion);

      if (rerunAnalysisForBreakpoint) {
        // Prod this breakpoint to refetch, circuitously:
        // - Setting the breakpoint options calls `client.setBreakpoint`
        // - That calls `setLogpoint` in `actions/logpoint`
        // - Which finally runs `setMultiSourceLogpoint` with analysis
        dispatch(setBreakpointOptions(cx, b.location, b.options));
      }
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
