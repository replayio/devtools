import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TimeStampedPoint } from "@replayio/protocol";
import sortBy from "lodash/sortBy";

import { getPausePointParams } from "shared/utils/environment";
import { MAX_FOCUS_REGION_DURATION } from "ui/actions/timeline";
import { UIState } from "ui/state";
import { HoveredItem, TimeRange, TimelineState } from "ui/state/timeline";
import { mergeSortedPointLists } from "ui/utils/timeline";

const initialFocusWindow = getPausePointParams().focusWindow;

// The backend has a hardcoded limit it will only load recordings
// up to 3 minutes long when running routines, otherwise it bails out.
// If the recording is longer than that, we _won't_ have data for
// React, Redux, or Jump to Code.
// This corresponds to `RoutineMaxWindowDurationSeconds` in the backend.
// The client uses recording duration in milliseconds.
// Use this to show a warning in the React and Redux panels.
export const MAX_RECORDING_LENGTH_FOR_ROUTINES_MS = 3 * 60 * 1000;

function initialTimelineState(): TimelineState {
  return {
    allPaintsReceived: false,
    currentTime: 0,
    focusWindow: initialFocusWindow
      ? { begin: initialFocusWindow.begin.time, end: initialFocusWindow.end.time }
      : null,
    hoveredItem: null,
    markTimeStampedPoint: null,
    hoverTime: null,
    playback: null,
    playbackFocusWindow: false,
    playbackPrecachedTime: 0,
    paints: [{ time: 0, point: "0" }],
    points: [{ time: 0, point: "0" }],
    recordingDuration: null,
    shouldAnimate: true,
    showFocusModeControls: false,
    stalled: false,
    timelineDimensions: { left: 1, top: 1, width: 1 },
    /** @deprecated This appears to be obsolete for now? */
    zoomRegion: { beginTime: 0, endTime: 0, scale: 1 },
    dragging: false,
  };
}

const timelineSlice = createSlice({
  name: "timeline",
  initialState: initialTimelineState,
  reducers: {
    setDragging(state, action: PayloadAction<boolean>) {
      state.dragging = action.payload;
    },
    setTimelineState(state, action: PayloadAction<Partial<TimelineState>>) {
      // This is poor action design and we should avoid this :(
      Object.assign(state, action.payload);
    },
    setPlaybackStalled(state, action: PayloadAction<boolean>) {
      state.stalled = action.payload;
    },
    setMarkTimeStampPoint(state, action: PayloadAction<TimeStampedPoint | null>) {
      state.markTimeStampedPoint = action.payload;
    },
    setHoveredItem(state, action: PayloadAction<HoveredItem | null>) {
      state.hoveredItem = action.payload;
    },
    setPlaybackPrecachedTime(state, action: PayloadAction<number>) {
      state.playbackPrecachedTime = action.payload;
    },
    setPlaybackFocusWindow(state, action: PayloadAction<boolean>) {
      state.playbackFocusWindow = action.payload;
    },
    setFocusWindow(state, action: PayloadAction<TimeRange | null>) {
      state.focusWindow = action.payload;
    },
    pointsReceived(state, action: PayloadAction<TimeStampedPoint[]>) {
      const mutablePoints = [...state.points];
      state.points = mergeSortedPointLists(
        mutablePoints,
        sortBy(action.payload, p => BigInt(p.point))
      );
    },
    paintsReceived(state, action: PayloadAction<TimeStampedPoint[]>) {
      const mutablePaints = [...state.paints];
      state.paints = mergeSortedPointLists(
        mutablePaints,
        sortBy(action.payload, p => BigInt(p.point))
      );
    },
    allPaintsReceived(state, action: PayloadAction<boolean>) {
      state.allPaintsReceived = action.payload;
    },
  },
});

export const {
  allPaintsReceived,
  setDragging,
  setHoveredItem,
  setMarkTimeStampPoint,
  setPlaybackPrecachedTime,
  setPlaybackFocusWindow,
  setPlaybackStalled,
  setFocusWindow,
  setTimelineState,
  pointsReceived,
  paintsReceived,
} = timelineSlice.actions;

export default timelineSlice.reducer;

export const getZoomRegion = (state: UIState) => state.timeline.zoomRegion;
export const getCurrentTime = (state: UIState) => state.timeline.currentTime;
export const getHoverTime = (state: UIState) => state.timeline.hoverTime;
export const getPlayback = (state: UIState) => state.timeline.playback;
export const getShowFocusModeControls = (state: UIState) => state.timeline.showFocusModeControls;
export const isDragging = (state: UIState) => state.timeline.dragging;
export const isPlaying = (state: UIState) => state.timeline.playback !== null;
export const isPlaybackStalled = (state: UIState) => state.timeline.stalled;
export const getRecordingDuration = (state: UIState) => state.timeline.recordingDuration;
export const getTimelineDimensions = (state: UIState) => state.timeline.timelineDimensions;
export const getMarkTimeStampedPoint = (state: UIState) => state.timeline.markTimeStampedPoint;
export const getHoveredItem = (state: UIState) => state.timeline.hoveredItem;
export const getPaints = (state: UIState) => state.timeline.paints;
export const getPoints = (state: UIState) => state.timeline.points;
export const getBasicProcessingProgress = (state: UIState) => {
  if (state.timeline.allPaintsReceived) {
    return 1.0;
  }
  const maxPaint = state.timeline.paints[state.timeline.paints.length - 1];
  const maxPoint = state.timeline.points[state.timeline.points.length - 1];
  if (!maxPoint || maxPoint.point === "0") {
    return 0.0;
  }
  return (1.0 * (maxPaint?.time || 0)) / maxPoint.time;
};
export const getPlaybackPrecachedTime = (state: UIState) => state.timeline.playbackPrecachedTime;
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

export const getRecordingMightHaveRoutines = (state: UIState) => {
  const { recordingDuration } = state.timeline;
  return recordingDuration !== null && recordingDuration! < MAX_RECORDING_LENGTH_FOR_ROUTINES_MS;
};
