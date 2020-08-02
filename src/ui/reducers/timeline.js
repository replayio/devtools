function initialTimelineState() {
  return {
    zoomRegion: { startTime: 0, endTime: 0 },
  };
}

export default function update(state = initialTimelineState(), action) {
  switch (action.type) {
    case "set_zoom": {
      return { ...state, zoomRegion: action.region };
    }
    default: {
      return state;
    }
  }
}

export function getZoomRegion(state) {
  return state.timeline.zoomRegion;
}
