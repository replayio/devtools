import { ExecutionPoint, PauseId } from "@recordreplay/protocol";
import { Pause, ThreadFront } from "protocol/thread";
import { client, log } from "protocol/socket";
import {
  getGraphicsAtTime,
  paintGraphics,
  mostRecentPaintOrMouseEvent,
  nextPaintOrMouseEvent,
  nextPaintEvent,
  previousPaintEvent,
  getFirstMeaningfulPaint,
  precacheScreenshots,
  snapTimeForPlayback,
  Video,
} from "protocol/graphics";
import {
  getCurrentTime,
  getHoverTime,
  getPlayback,
  getTrimRegion,
  getZoomRegion,
} from "ui/reducers/timeline";
import { getPendingComment } from "ui/reducers/comments";
import { UIStore, UIThunkAction } from ".";
import { Action } from "redux";
import { PauseEventArgs } from "protocol/thread/thread";
import { TimelineState, Tooltip, ZoomRegion, HoveredItem, TrimRegion } from "ui/state/timeline";
import { getPausePointParams, getTest } from "ui/utils/environment";
import { assert, waitForTime } from "protocol/utils";
import { features } from "ui/utils/prefs";
import KeyShortcuts, { isEditableElement } from "ui/utils/key-shortcuts";
import { getFirstComment } from "ui/hooks/comments/comments";
import { isRepaintEnabled } from "protocol/enable-repaint";
import { getModal } from "ui/reducers/app";
import clamp from "lodash/clamp";
import { TrimOperation } from "ui/components/Timeline/Trimmer";

export type SetTimelineStateAction = Action<"set_timeline_state"> & {
  state: Partial<TimelineState>;
};
export type SetPlaybackStalledAction = Action<"set_playback_stalled"> & { stalled: boolean };
export type UpdateTooltipAction = Action<"update_tooltip"> & { tooltip: Tooltip | null };
export type SetZoomRegionAction = Action<"set_zoom"> & { region: ZoomRegion };
export type SetHoveredItemAction = Action<"set_hovered_item"> & {
  hoveredItem: HoveredItem | null;
};
export type SetPlaybackPrecachedTimeAction = Action<"set_playback_precached_time"> & {
  time: number;
};
export type SetTrimRegionAction = Action<"set_trim_region"> & {
  trimRegion: {
    startTime: number;
    endTime: number;
  };
};

export type TimelineActions =
  | SetTimelineStateAction
  | SetPlaybackStalledAction
  | UpdateTooltipAction
  | SetZoomRegionAction
  | SetHoveredItemAction
  | SetPlaybackPrecachedTimeAction
  | SetTrimRegionAction;

export async function setupTimeline(store: UIStore) {
  const { dispatch } = store;
  ThreadFront.on("paused", args => dispatch(onPaused(args)));
  ThreadFront.warpCallback = onWarp(store);

  window.addEventListener("resize", () => dispatch(updateTimelineDimensions()));

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
  return async ({ getState, dispatch }) => {
    assert(ThreadFront.recordingId);

    const { duration } = await ThreadFront.getRecordingDescription();
    dispatch(setRecordingDescription(duration));

    await ThreadFront.waitForSession();
    const { endpoint } = await client.Session.getEndpoint({}, ThreadFront.sessionId!);
    let { point, time } = endpoint;

    const zoomRegion = getZoomRegion(getState());
    const newZoomRegion = { ...zoomRegion, endTime: time };
    dispatch(
      setTimelineState({ currentTime: time, recordingDuration: time, zoomRegion: newZoomRegion })
    );

    let hasFrames = false;
    const initialPausePoint = await getInitialPausePoint(ThreadFront.recordingId);
    if (initialPausePoint) {
      point = initialPausePoint.point;
      hasFrames = initialPausePoint.hasFrames;
      time = initialPausePoint.time;
    }

    ThreadFront.timeWarp(point, time, hasFrames, /* force */ true);
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

function onWarp(store: UIStore) {
  return function (point: ExecutionPoint, time: number) {
    const { startTime, endTime } = getZoomRegion(store.getState());
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
      if (!isRepaintEnabled()) {
        const { screen, mouse } = await getGraphicsAtTime(time);

        if (screen && getCurrentTime(getState()) == time) {
          dispatch(setTimelineState({ screenShot: screen, mouse }));
          paintGraphics(screen, mouse);
          Video.seek(time);
        }
      }

      dispatch(precacheScreenshots(time));
    } catch (e) {}
  };
}

function setRecordingDescription(duration: number): UIThunkAction {
  return ({ dispatch, getState }) => {
    const zoomRegion = getZoomRegion(getState());

    dispatch(
      setTimelineState({
        recordingDuration: duration,
        currentTime: duration,
        screenShot: null,
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
    const stateBeforeScreenshot = getState();
    const isTrimming = getModal(stateBeforeScreenshot) === "trimming";

    if (!updateGraphics || isRepaintEnabled() || isTrimming) {
      return;
    }

    try {
      const currentTime = getCurrentTime(stateBeforeScreenshot);
      const screenshotTime = time || currentTime;
      const { screen, mouse } = await getGraphicsAtTime(screenshotTime);
      const stateAfterScreenshot = getState();

      if (getHoverTime(stateAfterScreenshot) !== time) {
        return;
      }

      const playing = !!getPlayback(stateAfterScreenshot);
      paintGraphics(screen, mouse, playing);
      Video.seek(currentTime);
    } catch {}
  };
}

export function setPlaybackStalled(stalled: boolean): SetPlaybackStalledAction {
  console.log(`Stalled: ${stalled}`);
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

function updateUrl({
  point,
  time,
  hasFrames,
}: {
  point: ExecutionPoint;
  time: number;
  hasFrames: boolean;
}) {
  const url = new URL(window.location.toString());
  url.searchParams.set("point", point);
  url.searchParams.set("time", `${time}`);
  url.searchParams.set("hasFrames", `${hasFrames}`);
  window.history.pushState({}, "", url.toString());
}

export function seek(
  point: ExecutionPoint,
  time: number,
  hasFrames: boolean,
  pauseId?: PauseId
): UIThunkAction<boolean> {
  return ({ dispatch }) => {
    const pause = pauseId !== undefined ? Pause.getById(pauseId) : undefined;

    updateUrl({ point, time, hasFrames });
    dispatch({ type: "CLEAR_FRAME_POSITIONS" });
    if (pause) {
      ThreadFront.timeWarpToPause(pause);
    } else {
      ThreadFront.timeWarp(point, time, hasFrames);
    }
    return true;
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
    const playback = getPlayback(getState());

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
    const currentTime = getCurrentTime(state);
    const { endTime } = getZoomRegion(state);

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

    const playback = getPlayback(getState());

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
    let nextGraphicsTime!: number;
    let nextGraphicsPromise!: ReturnType<typeof getGraphicsAtTime>;

    const prepareNextGraphics = () => {
      nextGraphicsTime = nextPaintOrMouseEvent(currentTime)?.time || endTime;
      if (features.smoothPlayback) {
        nextGraphicsTime = snapTimeForPlayback(nextGraphicsTime);
      }
      nextGraphicsPromise = getGraphicsAtTime(nextGraphicsTime, true);
      dispatch(precacheScreenshots(nextGraphicsTime));
    };
    const shouldContinuePlayback = () => getPlayback(getState());
    prepareNextGraphics();

    Video.play();

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

          paintGraphics(screen, mouse, true);
        } catch (e) {}

        prepareNextGraphics();
      }
    }
  };
}

export function goToPrevPaint(): UIThunkAction {
  return ({ dispatch, getState }) => {
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
  return ({ dispatch, getState }) => {
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
  return ({ dispatch, getState }) => {
    const { target } = hoveredItem;

    const hoverEnabledForTarget = (features as any)[`${target}Hover`];
    if (!hoverEnabledForTarget) {
      return;
    }

    dispatch({ type: "set_hovered_item", hoveredItem });

    // Don't update the video if user is adding a new comment.
    const updateGraphics = !getPendingComment(getState());
    dispatch(setTimelineToTime(hoveredItem?.time || null, updateGraphics));
  };
}

export function clearHoveredItem(): UIThunkAction {
  return ({ dispatch }) => {
    dispatch({ type: "set_hovered_item", hoveredItem: null });
    dispatch(setTimelineToTime(null));
  };
}

export function setPlaybackPrecachedTime(time: number): SetPlaybackPrecachedTimeAction {
  return { type: "set_playback_precached_time", time };
}

export function setTrimRegion(trimRegion: {
  startTime: number;
  endTime: number;
}): SetTrimRegionAction {
  return { type: "set_trim_region", trimRegion };
}

export function updateTrimRegion(
  operation: TrimOperation,
  // Calculate the shift here so we can use it to compensate
  // for how off-center the mouse is while dragging the span.
  relativeShift: number
): UIThunkAction {
  return ({ dispatch, getState }) => {
    const state = getState();
    const hoverTime = getHoverTime(state)!;
    const trimRegion = getTrimRegion(state)!;
    const zoomRegion = getZoomRegion(state);

    if (operation === TrimOperation.moveSpan) {
      const { startTime, endTime } = trimRegion;
      const oldSpanMidpoint = (endTime + startTime) / 2;
      const newMidpoint = hoverTime;
      const duration = zoomRegion.endTime;
      const translateX = newMidpoint - oldSpanMidpoint;

      const newStart = clamp(startTime + translateX + relativeShift, 0, duration);
      const newEnd = clamp(endTime + translateX + relativeShift, newStart, duration);
      const newTrimRegion = { startTime: newStart, endTime: newEnd };

      dispatch(setTrimRegion(newTrimRegion));
    } else {
      const type = operation === TrimOperation.resizeStart ? "startTime" : "endTime";

      dispatch(setTrimRegion({ ...trimRegion, [type]: hoverTime }));
    }
  };
}
