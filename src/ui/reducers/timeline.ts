import { TimeStampedPoint } from "@replayio/protocol";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UIState } from "ui/state";
import { FocusRegion, HoveredItem, TimelineState, ZoomRegion } from "ui/state/timeline";
import {
  displayedEndForFocusRegion,
  displayedBeginForFocusRegion,
  mergeSortedPointLists,
} from "ui/utils/timeline";
import sortBy from "lodash/sortBy";
import maxBy from "lodash/maxBy";

function initialTimelineState(): TimelineState {
  return {
    allPaintsReceived: false,
    currentTime: 0,
    focusRegion: null,
    focusRegionBackup: null,
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
    pointsReceived(state, action: PayloadAction<TimeStampedPoint[]>) {
      state.points = mergeSortedPointLists(
        state.points,
        sortBy(action.payload, p => BigInt(p.point))
      );
    },
    paintsReceived(state, action: PayloadAction<TimeStampedPoint[]>) {
      state.paints = mergeSortedPointLists(
        state.paints,
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
  setHoveredItem,
  setPlaybackPrecachedTime,
  setPlaybackStalled,
  setFocusRegion,
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
export const getFocusRegionBackup = (state: UIState) => state.timeline.focusRegionBackup;
export const getIsInFocusMode = (state: UIState) =>
  state.timeline.focusRegion &&
  (displayedBeginForFocusRegion(state.timeline.focusRegion) !== 0 ||
    displayedEndForFocusRegion(state.timeline.focusRegion) !== state.timeline.zoomRegion.endTime);
