import assert from "assert";
import {
  ExecutionPoint,
  FocusWindowRequestBias,
  PauseId,
  ScreenShot,
  TimeStampedPointRange,
} from "@replayio/protocol";
import clamp from "lodash/clamp";

import { framePositionsCleared, resumed } from "devtools/client/debugger/src/reducers/pause";
import {
  addLastScreen,
  addScreenForPoint,
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
  timeIsBeyondKnownPaints,
} from "protocol/graphics";
import { ThreadFront } from "protocol/thread";
import { PauseEventArgs } from "protocol/thread/thread";
import { waitForTime } from "protocol/utils";
import {
  pointsBoundingTimeCache,
  sessionEndPointCache,
} from "replay-next/src/suspense/ExecutionPointsCache";
import { screenshotCache } from "replay-next/src/suspense/ScreenshotCache";
import { isExecutionPointsLessThan } from "replay-next/src/utils/time";
import {
  isTimeStampedPointRangeGreaterThan,
  isTimeStampedPointRangeLessThan,
} from "replay-next/src/utils/timeStampedPoints";
import { ReplayClientInterface } from "shared/client/types";
import {
  encodeObjectToURL,
  getPausePointParams,
  isTest,
  updateUrlWithParams,
} from "shared/utils/environment";
import { getFirstComment } from "ui/hooks/comments/comments";
import {
  getCurrentTime,
  getFocusWindow,
  getFocusWindowBackup,
  getHoverTime,
  getHoveredItem,
  getPlayback,
  getPlaybackFocusWindow,
  getPlaybackPrecachedTime,
  getRecordingDuration,
  getShowFocusModeControls,
  getZoomRegion,
  pointsReceived,
  setPlaybackPrecachedTime,
} from "ui/reducers/timeline";
import { FocusWindow, HoveredItem, PlaybackOptions, TimeRange } from "ui/state/timeline";
import KeyShortcuts, { isEditableElement } from "ui/utils/key-shortcuts";
import { trackEvent } from "ui/utils/telemetry";
import { rangeForFocusWindow } from "ui/utils/timeline";

import {
  setFocusWindow as newFocusWindow,
  setHoveredItem as setHoveredItemAction,
  setPlaybackStalled,
  setTimelineState,
} from "../reducers/timeline";
import type { UIStore, UIThunkAction } from "./index";

const DEFAULT_FOCUS_WINDOW_PERCENTAGE = 0.3;
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

export function jumpToInitialPausePoint(): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { ThreadFront, replayClient }) => {
    const endpoint = await sessionEndPointCache.readAsync(replayClient);
    dispatch(pointsReceived([endpoint]));
    let { point, time } = endpoint;

    const state = getState();
    const zoomRegion = getZoomRegion(state);
    const newZoomRegion = { ...zoomRegion, endTime: time };
    dispatch(
      setTimelineState({ currentTime: time, recordingDuration: time, zoomRegion: newZoomRegion })
    );

    if (isTest()) {
      ThreadFront.timeWarp(point, time, false);
      return;
    }

    const initialPausePoint = await getInitialPausePoint(ThreadFront.recordingId!);
    if (initialPausePoint?.point) {
      point = initialPausePoint.point;
    }
    if (initialPausePoint?.time) {
      time = initialPausePoint.time;
    }
    ThreadFront.timeWarp(point, time, false);
  };
}

export async function getInitialPausePoint(recordingId: string) {
  const pausePointParams = getPausePointParams();
  if (pausePointParams.point !== null) {
    return pausePointParams;
  }

  const firstComment = await getFirstComment(recordingId);
  if (firstComment) {
    const { point, time } = firstComment;
    return { point, time };
  }

  const firstMeaningfulPaint = await getFirstMeaningfulPaint();
  if (firstMeaningfulPaint) {
    const { point, time } = firstMeaningfulPaint;
    return { point, time };
  }
}

function onPaused({ point, time }: PauseEventArgs): UIThunkAction {
  return async (dispatch, getState) => {
    const focusWindow = getFocusWindow(getState());
    const params: Omit<PauseEventArgs, "openSource"> & { focusWindow: FocusWindow | null } = {
      focusWindow,
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
      console.error(error);
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
      const screenshot = await repaintAtPause(
        time,
        pauseId,
        time => getHoverTime(getState()) !== time,
        force
      );

      if (screenshot && point) {
        addLastScreen(screenshot, point, time);
      }
    }
  };
}

export function getUrlParams({
  focusWindow,
  point,
  time,
}: {
  focusWindow: FocusWindow | null;
  point: ExecutionPoint;
  time: number;
}) {
  return {
    point,
    time: `${time}`,
    focusWindow: encodeFocusWindow(focusWindow),
  };
}

export function updatePausePointParams({
  point,
  time,
  focusWindow,
}: {
  point: ExecutionPoint;
  time: number;
  focusWindow: FocusWindow | null;
}) {
  const params = getUrlParams({ focusWindow, point, time });
  updateUrlWithParams(params);
}

export function updateFocusWindowParam(): UIThunkAction<void> {
  return (dispatch, getState) => {
    const focusWindow = getFocusWindow(getState());
    updateUrlWithParams({ focusWindow: encodeFocusWindow(focusWindow) });
  };
}

function encodeFocusWindow(focusWindow: FocusWindow | null) {
  return focusWindow ? encodeObjectToURL(rangeForFocusWindow(focusWindow)) : undefined;
}

export function seek({
  autoPlay = false,
  executionPoint,
  openSource = false,
  pauseId,
  time,
}: {
  autoPlay?: boolean;
  executionPoint?: ExecutionPoint;
  openSource?: boolean;
  pauseId?: PauseId;
  time: number;
}): UIThunkAction<void> {
  return async (dispatch, getState, { replayClient, ThreadFront }) => {
    // If no ExecutionPoint provided, map time to nearest ExecutionPoint
    if (executionPoint == null) {
      time = await clampTime(replayClient, time);

      // getPointNearTime could take time while we're processing the recording
      // so we optimistically set the timeline to the target time
      dispatch(setTimelineToTime(time));

      const nearestEvent = mostRecentPaintOrMouseEvent(time);
      const timeStampedPoint = await replayClient.getPointNearTime(time);
      if (
        nearestEvent &&
        Math.abs(nearestEvent.time - time) < Math.abs(timeStampedPoint.time - time)
      ) {
        executionPoint = nearestEvent.point;
      } else {
        executionPoint = timeStampedPoint.point;
      }
    }

    assert(executionPoint != null, `Could not find execution point for time ${time}`);

    dispatch(framePositionsCleared());

    if (pauseId) {
      ThreadFront.timeWarpToPause({ point: executionPoint, time, pauseId }, openSource);
    } else {
      ThreadFront.timeWarp(executionPoint, time, openSource);
    }

    if (autoPlay) {
      dispatch(startPlayback());
    }
  };
}

async function clampTime(client: ReplayClientInterface, time: number) {
  const endpoint = await sessionEndPointCache.readAsync(client);
  return clamp(time, 0, endpoint.time);
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
  { beginTime: optBeginTime, endTime: optEndTime, beginPoint, endPoint }: PlaybackOptions = {
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

    const endTime =
      optEndTime ||
      (getPlaybackFocusWindow(state) && getFocusWindow(state)?.end.time) ||
      getZoomRegion(state).endTime;

    const beginDate = Date.now();
    const beginTime =
      optBeginTime ||
      (currentTime >= endTime
        ? (getPlaybackFocusWindow(state) && getFocusWindow(state)?.begin.time) || 0
        : currentTime);

    dispatch(
      setTimelineState({
        playback: { beginTime, beginDate, time: beginTime },
        currentTime: beginTime,
      })
    );

    dispatch(
      playbackPoints({ time: beginTime, point: beginPoint }, { time: endTime, point: endPoint })
    );
  };
}

export function stopPlayback(updateTime: boolean = true): UIThunkAction {
  return async (dispatch, getState) => {
    if (updateTime) {
      const playback = getPlayback(getState());

      if (playback) {
        dispatch(seek({ time: playback.time }));
      }
    }

    dispatch(setTimelineState({ playback: null }));
  };
}

export function replayPlayback(): UIThunkAction {
  return (dispatch, getState) => {
    const beginTime = 0;

    dispatch(seek({ openSource: true, time: beginTime }));
  };
}

export function playback(beginTime: number, endTime: number): UIThunkAction {
  return async dispatch => {
    dispatch(playbackPoints({ time: beginTime }, { time: endTime }));
  };
}

export function playbackPoints(
  begin: { time: number; point?: string },
  end: { time: number; point?: string }
): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    let beginDate = Date.now();
    let currentDate = beginDate;
    let currentTime = begin.time;
    let nextGraphicsTime!: number;
    let nextGraphicsPromise!: ReturnType<typeof getGraphicsAtTime>;
    let endPointScreenPromise: Promise<ScreenShot | undefined> = Promise.resolve(undefined);

    if (begin.point) {
      await addScreenForPoint(begin.point, begin.time);
    }

    if (end.point) {
      endPointScreenPromise = addScreenForPoint(end.point, end.time);
    }

    const prepareNextGraphics = () => {
      nextGraphicsTime = snapTimeForPlayback(nextPaintOrMouseEvent(currentTime)?.time || end.time);
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
      currentTime = begin.time + (currentDate - beginDate);

      if (currentTime > end.time) {
        if (end.point) {
          await endPointScreenPromise;
          dispatch(seek({ executionPoint: end.point, openSource: false, time: end.time }));
        } else {
          dispatch(seek({ time: end.time }));
        }
        return dispatch(setTimelineState({ currentTime: end.time, playback: null }));
      }

      dispatch(resumed());
      dispatch(
        setTimelineState({
          currentTime,
          playback: { beginTime: begin.time, beginDate, time: currentTime },
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
            begin.time = currentTime;
            beginDate = Date.now();
            dispatch(
              setTimelineState({
                currentTime,
                playback: { beginTime: begin.time, beginDate, time: currentTime },
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

    const time = Math.max(previous.time, beginTime);

    dispatch(seek({ time }));
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

    const time = Math.min(next.time, endTime);

    dispatch(seek({ time }));
  };
}

export function setHoveredItem(hoveredItem: HoveredItem): UIThunkAction {
  return dispatch => {
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

export function setFocusWindowImprecise(timeRange: TimeRange | null): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { replayClient }) => {
    if (timeRange === null) {
      dispatch(newFocusWindow(null));
      return;
    }

    const [pointsBoundingBegin, pointsBoundingEnd] = await Promise.all([
      pointsBoundingTimeCache.readAsync(replayClient, timeRange.begin),
      pointsBoundingTimeCache.readAsync(replayClient, timeRange.end),
    ]);
    const begin = pointsBoundingBegin.before;
    const end = pointsBoundingEnd.after;

    await dispatch(setFocusWindow({ begin, end }));
  };
}

export function setFocusWindow(
  focusWindow: TimeStampedPointRange | null
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { replayClient }) => {
    const state = getState();
    const currentTime = getCurrentTime(state);

    // Stop playback (if we're playing) to avoid the currentTime from getting out of bounds.
    const playback = getPlayback(state);
    if (playback !== null) {
      dispatch(stopPlayback());
    }

    if (focusWindow === null) {
      dispatch(setTimelineState({ focusWindow: null }));
      return;
    }

    let { begin, end } = focusWindow;

    const prevFocusWindow = getFocusWindow(state);
    const prevBeginTime = prevFocusWindow?.begin.time;
    const prevEndTime = prevFocusWindow?.end.time;

    // Ignore invalid requested focus windows.
    try {
      assert(isExecutionPointsLessThan(begin.point, end.point), "Invalid focus window");
    } catch (error) {
      console.error(error);
      return;
    }

    // Update the paint preview to match the handle that's being dragged.
    if (begin.time !== prevBeginTime && end.time === prevEndTime) {
      dispatch(setTimelineToTime(begin.time));
    } else if (begin.time === prevBeginTime && end.time !== prevEndTime) {
      dispatch(setTimelineToTime(end.time));
    } else {
      // Else just make sure the preview time stays within the moving window.
      const hoverTime = getHoverTime(state);
      if (hoverTime !== null) {
        if (hoverTime < begin.time) {
          dispatch(setTimelineToTime(begin.time));
        } else if (hoverTime > end.time) {
          dispatch(setTimelineToTime(end.time));
        }
      } else {
        dispatch(setTimelineToTime(currentTime));
      }
    }

    await dispatch(newFocusWindow({ begin, end }));
  };
}

export function setFocusWindowEndTime(end: number, sync: boolean): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const focusWindow = getFocusWindow(state);

    // If this is the first time the user is focusing, begin at the beginning of the recording (or zoom region).
    // Let the focus action/reducer will handle cropping for us.
    const begin = focusWindow?.begin.time ?? 0;

    await dispatch(setFocusWindowImprecise({ begin, end }));

    if (sync) {
      await dispatch(syncFocusedRegion());
      dispatch(updateFocusWindowParam());
    }
  };
}

export function setFocusWindowBeginTime(
  begin: number,
  sync: boolean
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const focusWindow = getFocusWindow(state);

    // If this is the first time the user is focusing, extend to the end of the recording (or zoom region).
    // Let the focus action/reducer will handle cropping for us.
    const end = focusWindow?.end.time ?? Number.POSITIVE_INFINITY;

    await dispatch(setFocusWindowImprecise({ begin, end }));

    if (sync) {
      await dispatch(syncFocusedRegion());
      dispatch(updateFocusWindowParam());
    }
  };
}

export function syncFocusedRegion(bias?: FocusWindowRequestBias): UIThunkAction {
  return async (dispatch, getState, { replayClient }) => {
    const state = getState();

    // Note that we should use the displayed focus window here because the deferred one may still have a pending update.
    const focusWindow = getFocusWindow(state);
    if (focusWindow === null) {
      return;
    }

    const focusWindowBackup = getFocusWindowBackup(state);

    const zoomTime = getZoomRegion(state);

    const begin = focusWindow
      ? focusWindow.begin
      : {
          point: "0",
          time: zoomTime.beginTime,
        };
    const end = focusWindow ? focusWindow.end : await sessionEndPointCache.readAsync(replayClient);

    // Compare the new focus range to the previous one to infer user intent.
    // This helps when a focus range can't be loaded in full.
    if (bias == null && focusWindowBackup != null) {
      if (isTimeStampedPointRangeLessThan(focusWindowBackup, focusWindow)) {
        bias = "begin";
      } else if (isTimeStampedPointRangeGreaterThan(focusWindowBackup, focusWindow)) {
        bias = "end";
      }
    }

    const window = await replayClient.requestFocusWindow({
      begin,
      bias,
      end,
    });

    // If the backend has selected a different focus window, refine our in-memory window to match
    if (begin.point !== window.begin.point || end.point !== window.end.point) {
      await dispatch(setFocusWindow(window));
    }
  };
}

export function enterFocusMode(): UIThunkAction {
  return async (dispatch, getState) => {
    trackEvent("timeline.start_focus_edit");

    const state = getState();
    const currentTime = getCurrentTime(state);
    const prevFocusWindow = getFocusWindow(state);
    const zoomRegion = getZoomRegion(state);

    // If there's no focus range, or it's the full recording,
    // shrink it to ~30% of the overall recording and center it around the current time.
    if (
      prevFocusWindow == null ||
      (prevFocusWindow.begin.time === zoomRegion.beginTime &&
        prevFocusWindow.end.time === zoomRegion.endTime)
    ) {
      const focusWindowSize =
        (zoomRegion.endTime - zoomRegion.beginTime) * DEFAULT_FOCUS_WINDOW_PERCENTAGE;

      const initialFocusWindow = {
        begin: Math.max(zoomRegion.beginTime, currentTime - focusWindowSize / 2),
        end: Math.min(zoomRegion.endTime, currentTime + focusWindowSize / 2),
      };

      await dispatch(setFocusWindowImprecise(initialFocusWindow));
    }

    await dispatch(
      setTimelineState({
        focusWindowBackup: prevFocusWindow,
        showFocusModeControls: true,
      })
    );
  };
}

export function exitFocusMode(): UIThunkAction {
  return dispatch => {
    trackEvent("timeline.exit_focus_edit");
    dispatch(
      setTimelineState({
        focusWindowBackup: null,
        showFocusModeControls: false,
      })
    );
  };
}

export function toggleFocusMode(): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const showFocusModeControls = getShowFocusModeControls(state);
    if (showFocusModeControls) {
      dispatch(exitFocusMode());
    } else {
      await dispatch(enterFocusMode());
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

      const paintPoint = gPaintPoints[index];
      // the client isn't used in the cache key, so it's OK to pass a dummy value here
      if (!screenshotCache.getValueIfCached(null as any, paintPoint.point, paintPoint.paintHash)) {
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
