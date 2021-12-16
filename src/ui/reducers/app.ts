import { AppState, EventKind, ReplayEvent } from "ui/state/app";
import { AppActions } from "ui/actions/app";
import { UIState } from "ui/state";
import { SessionActions } from "ui/actions/session";
import { features } from "../utils/prefs";
import { Location } from "@recordreplay/protocol";
import { getLocationAndConditionKey } from "devtools/client/debugger/src/utils/breakpoint";
import { isInTrimSpan, isSameTimeStampedPointRange } from "ui/utils/timeline";
import { compareBigInt } from "ui/utils/helpers";
import { getTrimRegion } from "ui/reducers/timeline";
import { getModal } from "./layout";

export const initialAppState: AppState = {
  expectedError: null,
  unexpectedError: null,
  trialExpired: false,
  initializedPanels: [],
  recordingDuration: 0,
  indexing: 0,
  loading: 4,
  displayedLoadingProgress: null,
  loadingFinished: false,
  uploading: null,
  awaitingSourcemaps: false,
  sessionId: null,
  analysisPoints: {},
  events: {},
  isNodePickerActive: false,
  hoveredLineNumberLocation: null,
  videoUrl: null,
  videoNode: null,
  workspaceId: null,
  recordingTarget: null,
  recordingWorkspace: null,
  loadedRegions: null,
};

export default function update(
  state: AppState = initialAppState,
  action: AppActions | SessionActions
): AppState {
  switch (action.type) {
    case "set_recording_duration": {
      return { ...state, recordingDuration: action.duration };
    }

    case "indexing": {
      return { ...state, indexing: action.indexing };
    }

    case "set_uploading": {
      return { ...state, uploading: action.uploading };
    }

    case "set_awaiting_sourcemaps": {
      return { ...state, awaitingSourcemaps: action.awaitingSourcemaps };
    }

    case "set_loaded_regions": {
      const recordingDuration = Math.max(
        ...action.parameters.loading.map(r => r.end.time),
        state.recordingDuration
      );
      return { ...state, loadedRegions: action.parameters, recordingDuration };
    }

    case "set_expected_error": {
      return { ...state, expectedError: action.error };
    }

    case "set_unexpected_error": {
      return { ...state, unexpectedError: action.error };
    }

    case "set_trial_expired": {
      return { ...state, trialExpired: action.expired };
    }

    case "set_initialized_panels": {
      return { ...state, initializedPanels: [...state.initializedPanels, action.panel] };
    }

    case "loading": {
      return { ...state, loading: action.loading };
    }

    case "set_displayed_loading_progress": {
      return { ...state, displayedLoadingProgress: action.progress };
    }

    case "set_loading_finished": {
      return { ...state, loadingFinished: action.finished };
    }

    case "set_session_id": {
      return { ...state, sessionId: action.sessionId };
    }

    case "set_analysis_points": {
      const id = getLocationAndConditionKey(action.location, action.condition);

      return {
        ...state,
        analysisPoints: {
          ...state.analysisPoints,
          [id]: action.analysisPoints,
        },
      };
    }

    case "set_analysis_error": {
      const id = getLocationAndConditionKey(action.location, action.condition);

      return {
        ...state,
        analysisPoints: {
          ...state.analysisPoints,
          [id]: "error",
        },
      };
    }

    case "set_events": {
      return {
        ...state,
        events: {
          ...state.events,
          [action.eventType]: action.events,
        },
      };
    }

    case "set_hovered_line_number_location": {
      return {
        ...state,
        hoveredLineNumberLocation: action.location,
      };
    }

    case "set_is_node_picker_active": {
      return {
        ...state,
        isNodePickerActive: action.active,
      };
    }

    case "set_video_node": {
      return {
        ...state,
        videoNode: action.videoNode,
      };
    }

    case "set_video_url": {
      return {
        ...state,
        videoUrl: action.videoUrl,
      };
    }

    case "set_workspace_id": {
      return { ...state, workspaceId: action.workspaceId };
    }

    case "set_recording_target": {
      return { ...state, recordingTarget: action.recordingTarget };
    }

    case "set_recording_workspace": {
      return { ...state, recordingWorkspace: action.workspace };
    }

    default: {
      return state;
    }
  }
}

export const getInitializedPanels = (state: UIState) => state.app.initializedPanels;
export const getRecordingDuration = (state: UIState) => state.app.recordingDuration;
export const getIndexing = (state: UIState) => state.app.indexing;
export const getIndexed = (state: UIState) => state.app.indexing == 100;
export const getLoading = (state: UIState) => state.app.loading;
export const getDisplayedLoadingProgress = (state: UIState) => state.app.displayedLoadingProgress;
export const getLoadingFinished = (state: UIState) => state.app.loadingFinished;
export const getLoadedRegions = (state: UIState) => state.app.loadedRegions;
export const getUploading = (state: UIState) => state.app.uploading;
export const getAwaitingSourcemaps = (state: UIState) => state.app.awaitingSourcemaps;
export const getSessionId = (state: UIState) => state.app.sessionId;
export const getExpectedError = (state: UIState) => state.app.expectedError;
export const getUnexpectedError = (state: UIState) => state.app.unexpectedError;
export const getTrialExpired = (state: UIState) => state.app.trialExpired;
export const getAnalysisPoints = (state: UIState) => state.app.analysisPoints;
export const getAnalysisPointsForLocation = (
  state: UIState,
  location: Location | null,
  condition = ""
) => {
  if (!location) return;
  const trimRegion = getTrimRegion(state);
  const key = getLocationAndConditionKey(location, condition);
  const points = state.app.analysisPoints[key];

  if (features.trimming && trimRegion && points && points !== "error") {
    return points.filter(p => isInTrimSpan(p.time, trimRegion));
  }

  return points;
};
export const getHoveredLineNumberLocation = (state: UIState) => state.app.hoveredLineNumberLocation;
export const getPointsForHoveredLineNumber = (state: UIState) => {
  const location = getHoveredLineNumberLocation(state);
  const points = getAnalysisPointsForLocation(state, location);
  const trimRegion = getTrimRegion(state);

  if (features.trimming && trimRegion && points && points !== "error") {
    return points.filter(p => isInTrimSpan(p.time, trimRegion));
  }

  return points;
};
const NO_EVENTS: MouseEvent[] = [];
export const getEventsForType = (state: UIState, type: string) =>
  state.app.events[type] || NO_EVENTS;

export const getFlatEvents = (state: UIState) => {
  let events: ReplayEvent[] = [];

  Object.keys(state.app.events).map(
    (eventKind: EventKind) => (events = [...events, ...state.app.events[eventKind]])
  );

  const sortedEvents = events.sort((a: ReplayEvent, b: ReplayEvent) =>
    compareBigInt(BigInt(a.point), BigInt(b.point))
  );
  const filteredEventTypes = ["keydown", "keyup"];
  const filteredEvents = sortedEvents.filter(e => !filteredEventTypes.includes(e.kind));

  return filteredEvents;
};
export const getIsNodePickerActive = (state: UIState) => state.app.isNodePickerActive;
export const getVideoUrl = (state: UIState) => state.app.videoUrl;
export const getVideoNode = (state: UIState) => state.app.videoNode;
export const getWorkspaceId = (state: UIState) => state.app.workspaceId;
export const getRecordingTarget = (state: UIState) => state.app.recordingTarget;
export const getRecordingWorkspace = (state: UIState) => state.app.recordingWorkspace;
export const isRegionLoaded = (state: UIState, time: number | null | undefined) =>
  typeof time !== "number" ||
  !!getLoadedRegions(state)?.loaded.some(
    region => time >= region.begin.time && time <= region.end.time
  );
export const isFinishedLoadingRegions = (state: UIState) => {
  const loadedRegions = getLoadedRegions(state)?.loaded;
  const loadingRegions = getLoadedRegions(state)?.loading;

  if (
    !loadingRegions ||
    !loadedRegions ||
    loadingRegions.length === 0 ||
    loadedRegions.length === 0
  ) {
    return false;
  }

  const loading = loadingRegions[0];
  const loaded = loadedRegions[0];

  return isSameTimeStampedPointRange(loading, loaded);
};
export const getIsTrimming = (state: UIState) => getModal(state) === "trimming";
