import assert from "assert";
import {
  ExecutionPoint,
  FocusWindowRequestBias,
  Location,
  PauseId,
  ScreenShot,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import clamp from "lodash/clamp";

import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import {
  frameSelected,
  getThreadContext,
  pauseCreationFailed,
  paused,
  resumed,
} from "devtools/client/debugger/src/reducers/pause";
import {
  clearSeekLock,
  getSeekLock,
  pauseRequestedAt,
  previewLocationCleared,
} from "devtools/client/debugger/src/selectors";
import { unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import {
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
  timeIsBeyondKnownPaints,
} from "protocol/graphics";
import { waitForTime } from "protocol/utils";
import {
  pointsBoundingTimeCache,
  sessionEndPointCache,
} from "replay-next/src/suspense/ExecutionPointsCache";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { screenshotCache } from "replay-next/src/suspense/ScreenshotCache";
import { ReplayClientInterface } from "shared/client/types";
import {
  encodeObjectToURL,
  getPausePointParams,
  isTest,
  updateUrlWithParams,
} from "shared/utils/environment";
import { isPointInRegion } from "shared/utils/time";
import { getFirstComment } from "ui/hooks/comments/comments";
import { getPreferredLocation, getSelectedLocation } from "ui/reducers/sources";
import {
  getCurrentTime,
  getFocusWindow,
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
import { HoveredItem, PlaybackOptions, TimeRange } from "ui/state/timeline";
import KeyShortcuts, { isEditableElement } from "ui/utils/key-shortcuts";
import { trackEvent } from "ui/utils/telemetry";

import {
  setFocusWindow as newFocusWindow,
  setHoveredItem as setHoveredItemAction,
  setPlaybackStalled,
  setTimelineState,
} from "../reducers/timeline";
import { getRecordingId } from "./app";
import type { UIStore, UIThunkAction } from "./index";

const DEFAULT_FOCUS_WINDOW_PERCENTAGE = 0.3;
export const MAX_FOCUS_REGION_DURATION = 60_000;
export const MIN_FOCUS_REGION_DURATION = 0;

export async function setupTimeline(store: UIStore) {
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
  return async (dispatch, getState, { replayClient }) => {
    const recordingId = getRecordingId(getState());
    assert(recordingId);
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
      dispatch(seek({ executionPoint: point, time, openSource: false }));
      return;
    }

    const initialPausePoint = await getInitialPausePoint(recordingId);
    if (initialPausePoint?.point) {
      point = initialPausePoint.point;
    }
    if (initialPausePoint?.time) {
      time = initialPausePoint.time;
    }
    dispatch(seek({ executionPoint: point, time, openSource: true }));
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

export function setHoverTime(time: number | null, updateGraphics = true): UIThunkAction {
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

export function getUrlParams({
  focusWindow,
  point,
  time,
}: {
  focusWindow: TimeStampedPointRange | null;
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
  focusWindow: TimeStampedPointRange | null;
}) {
  const params = getUrlParams({ focusWindow, point, time });
  updateUrlWithParams(params);
}

function encodeFocusWindow(focusWindow: TimeStampedPointRange | null) {
  return focusWindow ? encodeObjectToURL(focusWindow) : undefined;
}

export function seek({
  autoPlay = false,
  executionPoint,
  openSource = false,
  pauseId,
  time,
  location,
}: {
  autoPlay?: boolean;
  executionPoint?: ExecutionPoint;
  openSource?: boolean;
  pauseId?: PauseId;
  time: number;
  location?: Location;
}): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { replayClient }) => {
    const seekLock = new Object();
    dispatch(pauseRequestedAt({ seekLock, executionPoint, time, location }));
    dispatch(setTimelineState({ currentTime: time, playback: null }));
    const focusWindow = replayClient.getCurrentFocusWindow();

    if (!pauseId) {
      // If no ExecutionPoint provided, map time to nearest ExecutionPoint
      if (executionPoint == null) {
        const clampedTime = await clampTime(replayClient, time);

        const nearestEvent = mostRecentPaintOrMouseEvent(clampedTime);
        const timeStampedPoint = await replayClient.getPointNearTime(clampedTime);
        if (getSeekLock(getState()) !== seekLock) {
          // someone requested seeking to a different point while we were waiting
          return;
        }

        if (
          nearestEvent &&
          Math.abs(nearestEvent.time - clampedTime) < Math.abs(timeStampedPoint.time - clampedTime)
        ) {
          executionPoint = nearestEvent.point;
          time = nearestEvent.time;
        } else {
          executionPoint = timeStampedPoint.point;
          time = timeStampedPoint.time;
        }

        dispatch(pauseRequestedAt({ seekLock, executionPoint, time, location }));
      }

      if (focusWindow === null || !isPointInRegion(executionPoint, focusWindow)) {
        dispatch(pauseCreationFailed());
        return;
      }

      trackEvent("paused");

      try {
        pauseId = await pauseIdCache.readAsync(replayClient, executionPoint, time);
      } catch (e) {
        console.error(e);
        dispatch(pauseCreationFailed());
        return;
      }
      if (getSeekLock(getState()) !== seekLock) {
        // someone requested seeking to a different point while we were waiting
        return;
      }
    }

    assert(executionPoint);
    dispatch(paused({ executionPoint, time, id: pauseId }));

    const frames = await framesCache.readAsync(replayClient, pauseId);
    if (getSeekLock(getState()) !== seekLock) {
      // someone requested seeking to a different point while we were waiting
      return;
    }

    dispatch(previewLocationCleared());
    if (frames?.length) {
      const selectedFrame = frames[0];
      const cx = getThreadContext(getState());
      dispatch(frameSelected({ cx, pauseId, frameId: selectedFrame.frameId }));

      const currentLocation = getSelectedLocation(getState());
      const frameLocation = getPreferredLocation(getState().sources, selectedFrame.location);
      if (
        !currentLocation ||
        currentLocation.sourceId !== frameLocation.sourceId ||
        currentLocation.line !== frameLocation.line ||
        currentLocation.column !== frameLocation.column
      ) {
        dispatch(selectLocation(cx, frameLocation, openSource));
      }
    }

    updatePausePointParams({
      focusWindow,
      point: executionPoint,
      time,
    });
    dispatch(clearSeekLock());

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
  return (dispatch, getState, { replayClient }) => {
    const state = getState();
    const currentTime = getCurrentTime(state);

    if (timeIsBeyondKnownPaints(currentTime)) {
      return;
    }

    const endTime =
      optEndTime ||
      (getPlaybackFocusWindow(state) && replayClient.getCurrentFocusWindow()?.end.time) ||
      getZoomRegion(state).endTime;

    const beginDate = Date.now();
    const beginTime =
      optBeginTime ||
      (currentTime >= endTime
        ? (getPlaybackFocusWindow(state) && replayClient.getCurrentFocusWindow()?.begin.time) || 0
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
  return async (dispatch, getState) => {
    dispatch(unhighlightNode());

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
    dispatch(setHoverTime(hoveredItem?.time || null));
  };
}

export function clearHoveredItem(): UIThunkAction {
  return (dispatch, getState) => {
    const hoveredItem = getHoveredItem(getState());
    if (!hoveredItem) {
      return;
    }
    dispatch(setHoveredItemAction(null));
    dispatch(setHoverTime(null));
  };
}

export function setDisplayedFocusWindow(
  focusWindow: TimeRange | null
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const currentTime = getCurrentTime(state);

    // Stop playback (if we're playing) to avoid the currentTime from getting out of bounds.
    const playback = getPlayback(state);
    if (playback !== null) {
      dispatch(stopPlayback());
    }

    if (focusWindow === null) {
      dispatch(newFocusWindow(null));
      return;
    }

    let { begin, end } = focusWindow;

    const prevFocusWindow = getFocusWindow(state);
    const prevBeginTime = prevFocusWindow?.begin;
    const prevEndTime = prevFocusWindow?.end;

    // Ignore invalid requested focus windows.
    try {
      assert(begin <= end, "Invalid focus window");
    } catch (error) {
      console.error(error);
      return;
    }

    // Update the paint preview to match the handle that's being dragged.
    if (begin !== prevBeginTime && end === prevEndTime) {
      dispatch(setHoverTime(begin));
    } else if (begin === prevBeginTime && end !== prevEndTime) {
      dispatch(setHoverTime(end));
    } else {
      // Else just make sure the preview time stays within the moving window.
      const hoverTime = getHoverTime(state);
      if (hoverTime !== null) {
        if (hoverTime < begin) {
          dispatch(setHoverTime(begin));
        } else if (hoverTime > end) {
          dispatch(setHoverTime(end));
        }
      } else {
        dispatch(setHoverTime(currentTime));
      }
    }

    dispatch(newFocusWindow({ begin, end }));
  };
}

export interface PartialFocusWindow {
  begin?: {
    point?: ExecutionPoint;
    time: number;
  };
  end?: {
    point?: ExecutionPoint;
    time: number;
  };
}

export function requestFocusWindow(
  focusWindow: PartialFocusWindow,
  bias?: FocusWindowRequestBias
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { replayClient }) => {
    const currentFocusWindow = replayClient.getCurrentFocusWindow();
    assert(currentFocusWindow);

    let begin: TimeStampedPoint;
    if (focusWindow.begin) {
      if (focusWindow.begin.point) {
        begin = focusWindow.begin as TimeStampedPoint;
      } else {
        const pointsBoundingTime = await pointsBoundingTimeCache.readAsync(
          replayClient,
          focusWindow.begin.time
        );
        begin = pointsBoundingTime.before;
      }
    } else {
      begin = currentFocusWindow.begin;
    }

    let end: TimeStampedPoint;
    if (focusWindow.end) {
      if (focusWindow.end.point) {
        end = focusWindow.end as TimeStampedPoint;
      } else {
        const pointsBoundingTime = await pointsBoundingTimeCache.readAsync(
          replayClient,
          focusWindow.end.time
        );
        end = pointsBoundingTime.after;
      }
    } else {
      end = currentFocusWindow.end;
    }

    // Compare the new focus range to the previous one to infer user intent.
    // This helps when a focus range can't be loaded in full.
    if (!bias) {
      if (begin.time < currentFocusWindow.begin.time && end.time <= currentFocusWindow.end.time) {
        bias = "begin";
      } else if (
        begin.time >= currentFocusWindow.begin.time &&
        end.time > currentFocusWindow.end.time
      ) {
        bias = "end";
      }
    }

    const window = await replayClient.requestFocusWindow({
      begin,
      bias,
      end,
    });
    dispatch(newFocusWindow({ begin: window.begin.time, end: window.end.time }));
    updateUrlWithParams({ focusWindow: encodeFocusWindow(window) });
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
      (prevFocusWindow.begin === zoomRegion.beginTime && prevFocusWindow.end === zoomRegion.endTime)
    ) {
      const focusWindowSize =
        (zoomRegion.endTime - zoomRegion.beginTime) * DEFAULT_FOCUS_WINDOW_PERCENTAGE;

      const initialFocusWindow = {
        begin: Math.max(zoomRegion.beginTime, currentTime - focusWindowSize / 2),
        end: Math.min(zoomRegion.endTime, currentTime + focusWindowSize / 2),
      };

      await dispatch(setDisplayedFocusWindow(initialFocusWindow));
    }

    await dispatch(
      setTimelineState({
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
