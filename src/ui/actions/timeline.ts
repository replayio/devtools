import { ExecutionPoint, PauseId, RecordingId, TimeStampedPoint } from "record-replay-protocol";
import { Pause, ThreadFront } from "protocol/thread";
import { selectors } from "../reducers";
import {
  screenshotCache,
  addLastScreen,
  getGraphicsAtTime,
  paintGraphics,
  mostRecentPaintOrMouseEvent,
  getMostRecentPaintPoint,
} from "protocol/graphics";
import { UIStore, UIThunkAction } from ".";
import { Action } from "redux";
import { PauseEventArgs, RecordingDescription } from "protocol/thread/thread";
import { TimelineState, Tooltip, ZoomRegion } from "ui/state/timeline";

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

    dispatch(setTimelineState({ currentTime: time }));
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
      dispatch(setTimelineState({ highlightedMessage: message.id }));

      const paintPoint = getMostRecentPaintPoint(message.executionPointTime);
      if (!paintPoint) return;
      const { point, paintHash } = paintPoint;
      const screen = await screenshotCache.getScreenshotForTooltip(point, paintHash);

      const currentMessageId = selectors.getHighlightedMessage(getState());
      if (currentMessageId === message.id) {
        dispatch(updateTooltip({ screen, left: offset }));
      }
    } catch {}
  };
}

export function hideTooltip(): UIThunkAction {
  return ({ dispatch }) => {
    dispatch(updateTooltip(null));
    dispatch(setTimelineState({ hoverTime: null, highlightedMessage: null }));
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
