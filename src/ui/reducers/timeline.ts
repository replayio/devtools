import { TimelineAction } from "ui/actions/timeline";
import { UIState } from "ui/state";
import { TimelineState } from "ui/state/timeline";

function initialTimelineState(): TimelineState {
  return {
    zoomRegion: { startTime: 0, endTime: 0, scale: 1 },
    currentTime: 0,
    hoverTime: null,
    playback: null,
    highlightedMessage: null,
    hoveredMessage: null,
    unprocessedRegions: [],
    shouldAnimate: true,
    recordingDuration: null,
    screenShot: null,
    timelineDimensions: { left: 1, top: 1, width: 1 },
    mouse: null,
    loaded: false,
    tooltip: null,
  };
}

export default function update(
  state: TimelineState = initialTimelineState(),
  action: TimelineAction
): TimelineState {
  switch (action.type) {
    case "set_zoom": {
      return { ...state, zoomRegion: action.region };
    }

    case "set_timeline_state": {
      return { ...state, ...action.state };
    }

    case "update_tooltip": {
      return { ...state, tooltip: action.tooltip };
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
export const getHighlightedMessage = (state: UIState) => state.timeline.highlightedMessage;
export const getHoveredMessage = (state: UIState) => state.timeline.hoveredMessage;
export const getUnprocessedRegions = (state: UIState) => state.timeline.unprocessedRegions;
export const getRecordingDuration = (state: UIState) => state.timeline.recordingDuration;
export const getScreenShot = (state: UIState) => state.timeline.screenShot;
export const getMouse = (state: UIState) => state.timeline.mouse;
export const getTimelineDimensions = (state: UIState) => state.timeline.timelineDimensions;
export const getTimelineLoaded = (state: UIState) => state.timeline.loaded;
export const getTooltip = (state: UIState) => state.timeline.tooltip;
