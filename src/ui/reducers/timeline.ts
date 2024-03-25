import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TimeStampedPoint } from "@replayio/protocol";

import { MAX_FOCUS_REGION_DURATION } from "ui/actions/timeline";
import { getMutableParamsFromURL } from "ui/setup/dynamic/url";
import { UIState } from "ui/state";
import { HoveredItem, TimeRange, TimelineState } from "ui/state/timeline";

const { focusWindow: focusWindowFromURL } = getMutableParamsFromURL();

function initialTimelineState(): TimelineState {
  return {
    currentTime: 0,
    focusWindow: focusWindowFromURL
      ? { begin: focusWindowFromURL.begin.time, end: focusWindowFromURL.end.time }
      : null,
    hoveredItem: null,
    markTimeStampedPoint: null,
    maxRecordingDurationForRoutines: 0,
    hoverTime: null,
    playback: null,
    playbackFocusWindow: false,
    endpoint: { time: 0, point: "0" },
    recordingDuration: null,
    shouldAnimate: true,
    showFocusModeControls: false,
    showHoverTimeGraphics: false,
    stalled: false,
    timelineDimensions: { left: 1, top: 1, width: 1 },
    /** @deprecated This appears to be obsolete for now? */
    zoomRegion: { beginTime: 0, endTime: 0, scale: 1 },
  };
}

const timelineSlice = createSlice({
  name: "timeline",
  initialState: initialTimelineState,
  reducers: {
    setTimelineState(state, action: PayloadAction<Partial<TimelineState>>) {
      // This is poor action design and we should avoid this :(
      Object.assign(state, action.payload);
    },
    setMarkTimeStampPoint(state, action: PayloadAction<TimeStampedPoint | null>) {
      state.markTimeStampedPoint = action.payload;
    },
    setHoveredItem(state, action: PayloadAction<HoveredItem | null>) {
      state.hoveredItem = action.payload;
    },
    setPlaybackFocusWindow(state, action: PayloadAction<boolean>) {
      state.playbackFocusWindow = action.payload;
    },
    setFocusWindow(state, action: PayloadAction<TimeRange | null>) {
      state.focusWindow = action.payload;
    },
    setEndpoint(state, action: PayloadAction<TimeStampedPoint>) {
      state.endpoint = action.payload;
    },
  },
});

export const {
  setHoveredItem,
  setMarkTimeStampPoint,
  setPlaybackFocusWindow,
  setFocusWindow,
  setTimelineState,
  setEndpoint,
} = timelineSlice.actions;

export default timelineSlice.reducer;

export const getZoomRegion = (state: UIState) => state.timeline.zoomRegion;
export const getCurrentTime = (state: UIState) => state.timeline.currentTime;
export const getHoverTime = (state: UIState) => state.timeline.hoverTime;
export const getPlayback = (state: UIState) => state.timeline.playback;
export const getShowFocusModeControls = (state: UIState) => state.timeline.showFocusModeControls;
export const getShowHoverTimeGraphics = (state: UIState) => state.timeline.showHoverTimeGraphics;
export const isPlaying = (state: UIState) => state.timeline.playback !== null;
export const getRecordingDuration = (state: UIState) => state.timeline.recordingDuration;
export const getTimelineDimensions = (state: UIState) => state.timeline.timelineDimensions;
export const getMarkTimeStampedPoint = (state: UIState) => state.timeline.markTimeStampedPoint;
export const getHoveredItem = (state: UIState) => state.timeline.hoveredItem;
export const getEndpoint = (state: UIState) => state.timeline.endpoint;
export const getPlaybackFocusWindow = (state: UIState) => state.timeline.playbackFocusWindow;
export const getFocusWindow = (state: UIState) => state.timeline.focusWindow;
export const isMaximumFocusWindow = (state: UIState) => {
  const focusWindow = getFocusWindow(state);
  if (focusWindow) {
    const duration = focusWindow.end - focusWindow.begin;
    // JavaScript floating point numbers are not precise enough,
    // so in order to avoid occasional flickers from rounding errors, fuzz it a bit.
    return duration + 0.1 >= MAX_FOCUS_REGION_DURATION;
  } else {
    return false;
  }
};

export const getRecordingTooLongToSupportRoutines = (state: UIState) => {
  const { recordingDuration, maxRecordingDurationForRoutines } = state.timeline;
  return recordingDuration !== null && recordingDuration! > maxRecordingDurationForRoutines;
};
