import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UIState } from "ui/state";
import { FocusRegion, HoveredItem, TimelineState, ZoomRegion } from "ui/state/timeline";

function initialTimelineState(): TimelineState {
  return {
    currentTime: 0,
    focusRegion: null,
    focusRegionBackup: null,
    hoverTime: null,
    hoveredItem: null,
    playback: null,
    playbackPrecachedTime: 0,
    recordingDuration: null,
    shouldAnimate: true,
    showFocusModeControls: false,
    stalled: false,
    timelineDimensions: { left: 1, top: 1, width: 1 },
    unprocessedRegions: [],
    /** @deprecated This appears to be obsolete for now? */
    zoomRegion: { startTime: 0, endTime: 0, scale: 1 },
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
    setTrimRegion(state, action: PayloadAction<FocusRegion | null>) {
      state.focusRegion = action.payload;
    },
  },
});

export const {
  setHoveredItem,
  setPlaybackPrecachedTime,
  setPlaybackStalled,
  setTrimRegion,
  setTimelineState,
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
export const getPlaybackPrecachedTime = (state: UIState) => state.timeline.playbackPrecachedTime;
export const getFocusRegion = (state: UIState) => state.timeline.focusRegion;
export const getFocusRegionBackup = (state: UIState) => state.timeline.focusRegionBackup;
export const getIsInFocusMode = (state: UIState) =>
  state.timeline.focusRegion &&
  (state.timeline.focusRegion.startTime !== 0 ||
    state.timeline.focusRegion.endTime !== state.timeline.zoomRegion.endTime);
