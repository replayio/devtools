import { getExecutionPoint } from "devtools/client/debugger/src/reducers/pause";
import { TimelineActions } from "ui/actions/timeline";
import { UIState } from "ui/state";
import { TimelineState } from "ui/state/timeline";
import { isPointInRegions, overlap } from "ui/utils/timeline";

function initialTimelineState(): TimelineState {
  return {
    currentTime: 0,
    focusRegion: null,
    hoverTime: null,
    hoveredItem: null,
    playback: null,
    playbackPrecachedTime: 0,
    recordingDuration: null,
    shouldAnimate: true,
    stalled: false,
    timelineDimensions: { left: 1, top: 1, width: 1 },
    unprocessedRegions: [],
    zoomRegion: { startTime: 0, endTime: 0, scale: 1 },
  };
}

export default function update(
  state: TimelineState = initialTimelineState(),
  action: TimelineActions
): TimelineState {
  switch (action.type) {
    case "set_zoom": {
      return { ...state, zoomRegion: action.region };
    }

    case "set_timeline_state": {
      return { ...state, ...action.state };
    }

    case "set_playback_stalled": {
      return { ...state, stalled: action.stalled };
    }

    case "set_hovered_item": {
      return { ...state, hoveredItem: action.hoveredItem };
    }

    case "set_playback_precached_time": {
      return { ...state, playbackPrecachedTime: action.time };
    }

    case "set_trim_region": {
      return { ...state, focusRegion: action.focusRegion };
    }

    default: {
      return state;
    }
  }
}

export const getZoomRegion = (state: UIState) => state.timeline.zoomRegion;
export const getCurrentTime = (state: UIState) => state.timeline.currentTime;
export const getHoverTime = (state: UIState) => state.timeline.hoverTime;
export const getPlayback = (state: UIState) => state.timeline.playback;
export const isPlaybackStalled = (state: UIState) => state.timeline.stalled;
export const getUnprocessedRegions = (state: UIState) => state.timeline.unprocessedRegions;
export const getRecordingDuration = (state: UIState) => state.timeline.recordingDuration;
export const getTimelineDimensions = (state: UIState) => state.timeline.timelineDimensions;
export const getHoveredItem = (state: UIState) => state.timeline.hoveredItem;
export const getPlaybackPrecachedTime = (state: UIState) => state.timeline.playbackPrecachedTime;
export const getFocusRegion = (state: UIState) => state.timeline.focusRegion;
export const getIsInFocusMode = (state: UIState) =>
  state.timeline.focusRegion &&
  (state.timeline.focusRegion.startTime !== 0 ||
    state.timeline.focusRegion.endTime !== state.timeline.zoomRegion.endTime);
export const getIsAtFocusSoftLimit = (state: UIState) => {
  const focusRegion = getFocusRegion(state);

  if (!focusRegion) {
    return false;
  }

  const focusDuration = Math.floor(focusRegion.endTime - focusRegion.startTime);
  const duration = getZoomRegion(state).endTime;

  return focusDuration <= duration * 0.1;
};
