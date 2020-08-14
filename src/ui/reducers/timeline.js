function initialTimelineState() {
  return {
    zoomRegion: { startTime: 0, endTime: 0 },
    currentTime: 0,
    hoverTime: null,
    startDragTime: null,
    playback: null,
    messages: [],
    highlightedMessage: null,
    hoveredMessage: null,
    unprocessedRegions: [],
    shouldAnimate: true,
    recordingDuration: 0,
    screenShot: null,
    timelineDimensions: { left: 1, top: 1, width: 1 },
    mouse: null,
  };
}

export default function update(state = initialTimelineState(), action) {
  switch (action.type) {
    case "set_zoom": {
      return { ...state, zoomRegion: action.region };
    }
    case "set_timeline_state": {
      return { ...state, ...action.state };
    }

    default: {
      return state;
    }
  }
}

export const getZoomRegion = state => state.timeline.zoomRegion;
export const getCurrentTime = state => state.timeline.currentTime;
export const getHoverTime = state => state.timeline.hoverTime;
export const getStartDragTime = state => state.timeline.startDragTime;
export const getPlayback = state => state.timeline.playback;
export const getMessages = state => state.timeline.messages;
export const getHighlightedMessage = state => state.timeline.highlightedMessage;
export const getHoveredMessage = state => state.timeline.hoveredMessage;
export const getUnprocessedRegions = state => state.timeline.unprocessedRegions;
export const getRecordingDuration = state => state.timeline.recordingDuration;
export const getScreenShot = state => state.timeline.screenShot;
export const getMouse = state => state.timeline.mouse;
export const getTimelineDimensions = state => state.timeline.timelineDimensions;
