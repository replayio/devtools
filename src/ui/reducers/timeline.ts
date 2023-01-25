import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TimeRange, TimeStampedPoint } from "@replayio/protocol";
import sortBy from "lodash/sortBy";

import { UIThunkAction } from "ui/actions";
import { MAX_FOCUS_REGION_DURATION } from "ui/actions/timeline";
import { UIState } from "ui/state";
import { FocusRegion, HoveredItem, TimelineState } from "ui/state/timeline";
import { mergeSortedPointLists } from "ui/utils/timeline";

function initialTimelineState(): TimelineState {
  return {
    allPaintsReceived: false,
    currentTime: 0,
    focusRegion: null,
    focusRegionBackup: null,
    displayedFocusRegion: null,
    hoverTime: null,
    hoveredItem: null,
    playback: null,
    playbackPrecachedTime: 0,
    paints: [{ time: 0, point: "0" }],
    points: [{ time: 0, point: "0" }],
    recordingDuration: null,
    shouldAnimate: true,
    showFocusModeControls: false,
    stalled: false,
    timelineDimensions: { left: 1, top: 1, width: 1 },
    unprocessedRegions: [],
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
    setHoveredItem(state, action: PayloadAction<HoveredItem | null>) {
      state.hoveredItem = action.payload;
    },
    setPlaybackPrecachedTime(state, action: PayloadAction<number>) {
      state.playbackPrecachedTime = action.payload;
    },
    setFocusRegion(state, action: PayloadAction<FocusRegion | null>) {
      state.focusRegion = action.payload;
    },
    setDisplayedFocusRegion(state, action: PayloadAction<TimeRange | null>) {
      state.displayedFocusRegion = action.payload;
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

// If abs(A - B) > EPSILON, then A and B are considered different.
// If abs(A - B) < EPSILON, then A and B are considered equal.
const EPSILON = 0.0001;
// returns true is A is less than B, and the difference is greater than EPSILON
const lessThan = (a: number, b: number) => b - a > EPSILON;

export const {
  allPaintsReceived,
  setDragging,
  setHoveredItem,
  setPlaybackPrecachedTime,
  setPlaybackStalled,
  setFocusRegion,
  setDisplayedFocusRegion,
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
export const getUnprocessedRegions = (state: UIState) => state.timeline.unprocessedRegions;
export const getRecordingDuration = (state: UIState) => state.timeline.recordingDuration;
export const getTimelineDimensions = (state: UIState) => state.timeline.timelineDimensions;
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
export const getFocusRegion = (state: UIState) => state.timeline.focusRegion;
export const getDisplayedFocusRegion = (state: UIState) => state.timeline.displayedFocusRegion;
export const isMaximumFocusRegion = (state: UIState) => {
  const focusRegion = state.timeline.displayedFocusRegion;
  if (focusRegion) {
    const duration = focusRegion.end - focusRegion.begin;
    // JavaScript floating point numbers are not precise enough,
    // so in order to avoid occasional flickers from rounding errors, fuzz it a bit.
    return duration + 0.1 >= MAX_FOCUS_REGION_DURATION;
  } else {
    return false;
  }
};
export const getFocusRegionBackup = (state: UIState) => state.timeline.focusRegionBackup;
