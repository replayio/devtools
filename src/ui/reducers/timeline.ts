import { TimelineActions } from "ui/actions/timeline";
import { UIState } from "ui/state";
import { TimelineState } from "ui/state/timeline";

function initialTimelineState(): TimelineState {
  return {
    zoomRegion: { startTime: 0, endTime: 0, scale: 1 },
    currentTime: 0,
    hoverTime: null,
    playback: null,
    playbackPrecachedTime: 0,
    unprocessedRegions: [],
    shouldAnimate: true,
    recordingDuration: null,
    screenShot: null,
    timelineDimensions: { left: 1, top: 1, width: 1 },
    mouse: null,
    tooltip: null,
    hoveredItem: null,
    trimRegion: null,
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
      const playback = state.playback ? { ...state.playback, stalled: action.stalled } : null;
      return { ...state, playback };
    }

    case "update_tooltip": {
      return { ...state, tooltip: action.tooltip };
    }

    case "set_hovered_item": {
      return { ...state, hoveredItem: action.hoveredItem };
    }

    case "set_playback_precached_time": {
      return { ...state, playbackPrecachedTime: action.time };
    }

    case "set_trim_region": {
      return { ...state, trimRegion: action.trimRegion };
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
export const isPlaybackStalled = (state: UIState) => state.timeline.playback?.stalled || false;
export const getUnprocessedRegions = (state: UIState) => state.timeline.unprocessedRegions;
export const getRecordingDuration = (state: UIState) => state.timeline.recordingDuration;
export const getScreenShot = (state: UIState) => state.timeline.screenShot;
export const getMouse = (state: UIState) => state.timeline.mouse;
export const getTimelineDimensions = (state: UIState) => state.timeline.timelineDimensions;
export const getTooltip = (state: UIState) => state.timeline.tooltip;
export const getHoveredItem = (state: UIState) => state.timeline.hoveredItem;
export const getPlaybackPrecachedTime = (state: UIState) => state.timeline.playbackPrecachedTime;
export const getTrimRegion = (state: UIState) => state.timeline.trimRegion;
