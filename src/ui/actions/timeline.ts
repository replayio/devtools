import assert from "assert";
import {
  ExecutionPoint,
  FocusWindowRequestBias,
  Location,
  PauseDescription,
  PauseId,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import clamp from "lodash/clamp";

import { setPreviewPausedLocation } from "devtools/client/debugger/src/actions/pause";
import { selectLocation } from "devtools/client/debugger/src/actions/sources/select";
import {
  frameSelected,
  getThreadContext,
  pauseCreationFailed,
  paused,
} from "devtools/client/debugger/src/reducers/pause";
import {
  clearQueuedCommands,
  clearSeekLock,
  dequeueCommand as dequeueCommandAction,
  enqueueCommand,
  getExecutionPoint,
  getNextQueuedCommand,
  getSeekLock,
  getSeekState,
  getSelectedFrameId,
  pauseRequestedAt,
  previewLocationCleared,
  stepping,
} from "devtools/client/debugger/src/selectors";
import { unhighlightNode } from "devtools/client/inspector/markup/actions/markup";
import {
  findFirstMeaningfulPaint,
  findMostRecentPaint,
  findNextPaintEvent,
  findPreviousPaintEvent,
} from "protocol/PaintsCache";
import { findMostRecentMouseEvent } from "protocol/RecordedEventsCache";
import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import {
  pointsBoundingTimeCache,
  sessionEndPointCache,
} from "replay-next/src/suspense/ExecutionPointsCache";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { FindTargetCommand, resumeTargetCache } from "replay-next/src/suspense/ResumeTargetCache";
import { ReplayClientInterface } from "shared/client/types";
import { isTest } from "shared/utils/environment";
import { isPointInRegion, maxTimeStampedPoint, minTimeStampedPoint } from "shared/utils/time";
import { getFirstComment } from "ui/hooks/comments/comments";
import {
  getPreferredLocation,
  getSelectedLocation,
  getSelectedSourceId,
} from "ui/reducers/sources";
import {
  getCurrentTime,
  getFocusWindow,
  getHoverTime,
  getHoveredItem,
  getPlayback,
  getPlaybackFocusWindow,
  getShowFocusModeControls,
  getZoomRegion,
  setFocusWindow as newFocusWindow,
  setEndpoint,
  setHoveredItem as setHoveredItemAction,
  setTimelineState,
} from "ui/reducers/timeline";
import { getMutableParamsFromURL } from "ui/setup/dynamic/url";
import { HoveredItem, PlaybackOptions, TimeRange } from "ui/state/timeline";
import KeyShortcuts, { isEditableElement } from "ui/utils/key-shortcuts";
import { trackEvent } from "ui/utils/telemetry";

import { getRecordingId } from "./app";
import type { UIStore, UIThunkAction } from "./index";

const { point: pointFromURL, time: timeFromURL } = getMutableParamsFromURL();

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
    dispatch(setEndpoint(endpoint));

    let { point, time } = endpoint;

    const state = getState();
    const zoomRegion = getZoomRegion(state);
    const newZoomRegion = { ...zoomRegion, endTime: time };

    const { maxRecordingDurationForRoutines } = await recordingCapabilitiesCache.readAsync(
      replayClient
    );

    dispatch(
      setTimelineState({
        currentTime: time,
        recordingDuration: time,
        zoomRegion: newZoomRegion,
        maxRecordingDurationForRoutines,
      })
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
  if (pointFromURL !== null && timeFromURL !== null) {
    return {
      point: pointFromURL,
      time: timeFromURL,
    };
  }

  const firstComment = await getFirstComment(recordingId);
  if (firstComment) {
    const { point, time } = firstComment;
    return { point, time };
  }

  const firstMeaningfulPaint = await findFirstMeaningfulPaint();
  if (firstMeaningfulPaint) {
    const { point, time } = firstMeaningfulPaint;
    return { point, time };
  }
}

export function setHoverTime(time: number | null, updateGraphics = true): UIThunkAction {
  return dispatch => {
    dispatch(
      setTimelineState({ hoverTime: time, showHoverTimeGraphics: updateGraphics && time != null })
    );
  };
}

export function step(command: FindTargetCommand): UIThunkAction<Promise<any>> {
  return async (dispatch, getState, { replayClient }) => {
    const state = getState();
    if (getSeekState(state) === "step") {
      // another call to step() is already in progress, it will execute the enqueued command
      dispatch(enqueueCommand(command));
      return;
    }
    const focusWindow = replayClient.getCurrentFocusWindow();
    let point = getExecutionPoint(state);
    let selectedFrameId = getSelectedFrameId(state);
    const sourceId = getSelectedSourceId(state);
    if (!point || !focusWindow) {
      return;
    }

    const seekLock = new Object();
    dispatch(stepping(seekLock));
    dispatch(enqueueCommand(command));

    let resumeTarget: PauseDescription | undefined;
    let location: Location | undefined;
    let nextCommand: FindTargetCommand | undefined = dispatch(dequeueCommand());
    while (nextCommand) {
      resumeTarget = await resumeTargetCache.readAsync(
        replayClient,
        nextCommand,
        point,
        selectedFrameId,
        sourceId
      );

      if (resumeTarget && isPointInRegion(resumeTarget.point, focusWindow)) {
        point = resumeTarget.point;
        selectedFrameId = null;
        location = resumeTarget.frame
          ? getPreferredLocation(state.sources, resumeTarget.frame)
          : undefined;
        if (location) {
          dispatch(setPreviewPausedLocation(location));
        } else {
          dispatch(previewLocationCleared());
        }
      } else {
        dispatch(pauseCreationFailed());
        dispatch(clearQueuedCommands());
        return;
      }

      nextCommand = dispatch(dequeueCommand());
    }

    if (resumeTarget && isPointInRegion(resumeTarget.point, focusWindow)) {
      const { point, time } = resumeTarget;
      await dispatch(seek({ executionPoint: point, time, location, openSource: !!location }));
    } else {
      dispatch(pauseCreationFailed());
    }
  };
}

function dequeueCommand(): UIThunkAction<FindTargetCommand> {
  return (dispatch, getState) => {
    const command = getNextQueuedCommand(getState());
    dispatch(dequeueCommandAction());
    return command;
  };
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

        const nearestPaint = findMostRecentPaint(clampedTime);
        const nearestMouseEvent = findMostRecentMouseEvent(clampedTime);
        const nearestEvent =
          nearestPaint && nearestMouseEvent
            ? Math.abs(nearestPaint.time - clampedTime) <
              Math.abs(nearestMouseEvent.time - clampedTime)
              ? nearestPaint
              : nearestMouseEvent
            : nearestPaint ?? nearestMouseEvent ?? null;

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

    if (playback) {
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
  return (dispatch, getState, { replayClient }) => {
    const state = getState();
    const currentTime = getCurrentTime(state);

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
        playback: { beginTime, beginDate, endTime, time: beginTime },
        currentTime: beginTime,
      })
    );

    dispatch(unhighlightNode());
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

export function goToPrevPaint(): UIThunkAction {
  return (dispatch, getState) => {
    const currentTime = getCurrentTime(getState());
    const { beginTime: beginTime } = getZoomRegion(getState());

    if (currentTime == beginTime) {
      return;
    }

    const previous = findPreviousPaintEvent(currentTime);
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

    const next = findNextPaintEvent(currentTime);
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

export function extendFocusWindowIfNecessary(
  focusWindow: TimeStampedPointRange
): UIThunkAction<Promise<void>> {
  return async (dispatch, getState, { replayClient }) => {
    const currentFocusWindow = replayClient.getCurrentFocusWindow();
    assert(currentFocusWindow);
    if (
      isPointInRegion(focusWindow.begin.point, currentFocusWindow) &&
      isPointInRegion(focusWindow.end.point, currentFocusWindow)
    ) {
      return;
    }

    const begin = minTimeStampedPoint([focusWindow.begin, currentFocusWindow.begin])!;
    const end = maxTimeStampedPoint([focusWindow.end, currentFocusWindow.end])!;
    const bias = begin.point !== currentFocusWindow.begin.point ? "begin" : "end";
    await dispatch(requestFocusWindow({ begin, end }, bias));
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
