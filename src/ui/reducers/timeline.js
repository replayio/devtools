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

export function getZoomRegion(state) {
  return state.timeline.zoomRegion;
}

export function getCurrentTime(state) {
  return state.timeline.currentTime;
}

export function getHoverTime(state) {
  return state.timeline.hoverTime;
}

export function getStartDragTime(state) {
  return state.timeline.startDragTime;
}

export function getPlayback(state) {
  return state.timeline.playback;
}

export function getMessages(state) {
  return state.timeline.messages;
}

export function getHighlightedMessage(state) {
  return state.timeline.highlightedMessage;
}

export function getHoveredMessage(state) {
  return state.timeline.hoveredMessage;
}

export function getUnprocessedRegions(state) {
  return state.timeline.unprocessedRegions;
}

export function getRecordingDuration(state) {
  return state.timeline.recordingDuration;
}

export function getScreenShot(state) {
  return state.timeline.screenShot;
}

export function getMouse(state) {
  return state.timeline.mouse;
}
