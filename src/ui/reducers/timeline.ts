import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TimeStampedPoint } from "@replayio/protocol";
import sortBy from "lodash/sortBy";

import { UIThunkAction } from "ui/actions";
import { MAX_FOCUS_REGION_DURATION } from "ui/actions/timeline";
import { UIState } from "ui/state";
import { FocusRegion, HoveredItem, TimelineState } from "ui/state/timeline";
import {
  displayedBeginForFocusRegion,
  displayedEndForFocusRegion,
  mergeSortedPointLists,
} from "ui/utils/timeline";

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
  setHoveredItem,
  setPlaybackPrecachedTime,
  setPlaybackStalled,
  setFocusRegion,
  setTimelineState,
  pointsReceived,
  paintsReceived,
} = timelineSlice.actions;

export const pointsReceivedThunk = (points: TimeStampedPoint[]): UIThunkAction => {
  return (dispatch, getState) => {
    const state = getState() as UIState;
    dispatch(pointsReceived(points));
    const focusRegion = getFocusRegion(state);
    if (!focusRegion) {
      return;
    }
    // If we have just received points that we did not know about, those points
    // might represent a better fit for the user-requested focus window than
    // whatever points we were using before. If so, we will narrow the focus
    // region down farther to the best-found points. However, in the case that
    // we might be mucking about with time beyond the precision of floating
    // point numbers, we should just chill, we are close enough to the user
    // specified boundary (hence the epsilon check).
    // See https://github.com/replayio/devtools/pull/7666 for more info.
    const betterFocusStart = points.find(
      p =>
        BigInt(focusRegion.begin.point) < BigInt(p.point) && lessThan(p.time, focusRegion.beginTime)
    );
    const betterFocusEnd = points.find(
      p => BigInt(p.point) < BigInt(focusRegion.end.point) && lessThan(focusRegion.endTime, p.time)
    );
    if (betterFocusStart || betterFocusEnd) {
      dispatch(
        setFocusRegion({
          ...focusRegion,
          begin: betterFocusStart || focusRegion.begin,
          end: betterFocusEnd || focusRegion.end,
        })
      );
    }
  };
};

export default timelineSlice.reducer;

export const getZoomRegion = (state: UIState) => state.timeline.zoomRegion;
export const getCurrentTime = (state: UIState) => state.timeline.currentTime;
export const getHoverTime = (state: UIState) => state.timeline.hoverTime;
export const getPlayback = (state: UIState) => state.timeline.playback;
export const getShowFocusModeControls = (state: UIState) => state.timeline.showFocusModeControls;
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
export const isMaximumFocusRegion = (state: UIState) => {
  const focusRegion = state.timeline.focusRegion;
  if (focusRegion) {
    const duration = focusRegion.endTime - focusRegion.beginTime;
    // JavaScript floating point numbers are not precise enough,
    // so in order to avoid occasional flickers from rounding errors, fuzz it a bit.
    return duration + 0.1 >= MAX_FOCUS_REGION_DURATION;
  } else {
    return false;
  }
};
export const getFocusRegionBackup = (state: UIState) => state.timeline.focusRegionBackup;
export const getIsInFocusMode = (state: UIState) =>
  state.timeline.focusRegion &&
  (displayedBeginForFocusRegion(state.timeline.focusRegion) !== 0 ||
    displayedEndForFocusRegion(state.timeline.focusRegion) !== state.timeline.zoomRegion.endTime);
