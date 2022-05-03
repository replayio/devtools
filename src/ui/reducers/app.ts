import {
  AnalysisError,
  AnalysisPayload,
  AppState,
  AppTheme,
  EventKind,
  ProtocolError,
  ReplayEvent,
} from "ui/state/app";
import { AppActions } from "ui/actions/app";
import { UIState } from "ui/state";
import { SessionActions } from "ui/actions/session";
import { Location } from "@recordreplay/protocol";
import { getLocationAndConditionKey } from "devtools/client/debugger/src/utils/breakpoint";
import { isInTrimSpan, isPointInRegions, isTimeInRegions, overlap } from "ui/utils/timeline";
import { compareBigInt } from "ui/utils/helpers";
import { getFocusRegion, getZoomRegion } from "ui/reducers/timeline";

import { getSelectedPanel, getViewMode } from "./layout";
import { prefs } from "ui/utils/prefs";
import { getNonLoadingRegionTimeRanges } from "ui/utils/app";
import { getSystemColorSchemePreference } from "ui/utils/environment";
import { createSelector } from "@reduxjs/toolkit";
import { getExecutionPoint } from "devtools/client/debugger/src/selectors";

export const initialAppState: AppState = {
  mode: "devtools",
  analysisPoints: {},
  awaitingSourcemaps: false,
  canvas: null,
  defaultSettingsTab: "Preferences",
  displayedLoadingProgress: null,
  events: {},
  expectedError: null,
  hoveredLineNumberLocation: null,
  initializedPanels: [],
  isNodePickerActive: false,
  isNodePickerInitializing: false,
  loadedRegions: null,
  loading: 4,
  loadingFinished: false,
  loadingPageTipIndex: 0,
  modal: null,
  modalOptions: null,
  mouseTargetsLoading: false,
  recordingDuration: 0,
  recordingTarget: null,
  recordingWorkspace: null,
  sessionId: null,
  theme: prefs.theme as AppTheme,
  trialExpired: false,
  unexpectedError: null,
  uploading: null,
  videoUrl: null,
  workspaceId: null,
  currentPoint: null,
};

export default function update(
  state: AppState = initialAppState,
  action: AppActions | SessionActions
): AppState {
  switch (action.type) {
    case "mouse_targets_loading": {
      return { ...state, mouseTargetsLoading: action.loading };
    }
    case "set_recording_duration": {
      return { ...state, recordingDuration: action.duration };
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
      return {
        ...state,
        loadedRegions: action.parameters,
        recordingDuration,
      };
    }

    case "set_expected_error": {
      return { ...state, expectedError: action.error, modal: null, modalOptions: null };
    }

    case "set_unexpected_error": {
      return { ...state, unexpectedError: action.error, modal: null, modalOptions: null };
    }

    case "clear_expected_error": {
      return { ...state, expectedError: null, modal: null, modalOptions: null };
    }

    case "set_trial_expired": {
      return { ...state, trialExpired: action.expired };
    }

    case "update_theme": {
      return { ...state, theme: action.theme };
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

    case "set_modal": {
      return { ...state, modal: action.modal, modalOptions: action.options };
    }

    case "set_analysis_points": {
      const id = getLocationAndConditionKey(action.location, action.condition);

      return {
        ...state,
        analysisPoints: {
          ...state.analysisPoints,
          [id]: {
            data: action.analysisPoints,
            error: null,
          },
        },
      };
    }

    case "set_analysis_error": {
      const id = getLocationAndConditionKey(action.location, action.condition);

      return {
        ...state,
        analysisPoints: {
          ...state.analysisPoints,
          [id]: {
            data: [],
            error:
              action.errorKey === ProtocolError.TooManyPoints
                ? AnalysisError.TooManyPoints
                : AnalysisError.Default,
          },
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

    case "set_is_node_picker_initializing": {
      return {
        ...state,
        isNodePickerInitializing: action.initializing,
      };
    }

    case "set_canvas": {
      return {
        ...state,
        canvas: action.canvas,
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

    case "set_default_settings_tab": {
      return { ...state, defaultSettingsTab: action.tabTitle };
    }

    case "set_recording_target": {
      return { ...state, recordingTarget: action.recordingTarget };
    }

    case "set_recording_workspace": {
      return { ...state, recordingWorkspace: action.workspace };
    }

    case "set_current_point": {
      return {
        ...state,
        currentPoint: action.currentPoint,
      };
    }

    case "set_app_mode": {
      return {
        ...state,
        mode: action.mode,
      };
    }

    default: {
      return state;
    }
  }
}

const getPointsInTrimSpan = (state: UIState, points: AnalysisPayload) => {
  const focusRegion = getFocusRegion(state);

  if (!focusRegion || points.error) {
    return points;
  }

  return {
    ...points,
    data: points.data.filter(p => isInTrimSpan(p.time, focusRegion)) || [],
  };
};

export const getTheme = (state: UIState) =>
  state.app.theme === "system" ? getSystemColorSchemePreference() : state.app.theme;
export const getThemePreference = (state: UIState) => state.app.theme;
export const isInspectorSelected = (state: UIState) =>
  getViewMode(state) === "dev" && getSelectedPanel(state) == "inspector";
export const getInitializedPanels = (state: UIState) => state.app.initializedPanels;
export const getRecordingDuration = (state: UIState) => state.app.recordingDuration;

export const getLoading = (state: UIState) => state.app.loading;
export const getDisplayedLoadingProgress = (state: UIState) => state.app.displayedLoadingProgress;
export const getLoadingFinished = (state: UIState) => state.app.loadingFinished;
export const getLoadedRegions = (state: UIState) => state.app.loadedRegions;
export const getIndexedAndLoadedRegions = createSelector(getLoadedRegions, loadedRegions => {
  if (!loadedRegions) {
    return [];
  }
  return overlap(loadedRegions.indexed, loadedRegions.loaded);
});
export const getIndexingProgress = createSelector(
  getLoadedRegions,
  getIndexedAndLoadedRegions,
  (regions, indexedAndLoaded) => {
    if (!regions) {
      return null;
    }

    const { loading } = regions;

    const indexedProgress = indexedAndLoaded
      .filter(region => {
        // It's possible for the indexedProgress to not be a subset of
        // loadingRegions. This acts as a guard if that should happen.
        // Todo: Investigate this on the backend.
        return loading.some(
          loadingRegion =>
            region.begin.time >= loadingRegion.begin.time &&
            region.end.time <= loadingRegion.end.time
        );
      })
      .reduce((sum, region) => sum + (region.end.time - region.begin.time), 0);
    const loadingProgress = loading.reduce(
      (sum, region) => sum + (region.end.time - region.begin.time),
      0
    );

    return (indexedProgress / loadingProgress) * 100 || 0;
  }
);
export const getIsIndexed = createSelector(
  getIndexingProgress,
  indexingProgress => indexingProgress === 100
);

export const getNonLoadingTimeRanges = (state: UIState) => {
  const loadingRegions = getLoadedRegions(state)?.loading || [];
  const endTime = getZoomRegion(state).endTime;

  return getNonLoadingRegionTimeRanges(loadingRegions, endTime);
};
export const getIsInLoadedRegion = createSelector(
  getLoadedRegions,
  getExecutionPoint,
  (regions, currentPausePoint) => {
    const loadedRegions = regions?.loaded;

    if (!currentPausePoint || !loadedRegions || loadedRegions.length === 0) {
      return false;
    }

    return isPointInRegions(loadedRegions, currentPausePoint);
  }
);
export const getUploading = (state: UIState) => state.app.uploading;
export const getAwaitingSourcemaps = (state: UIState) => state.app.awaitingSourcemaps;
export const getSessionId = (state: UIState) => state.app.sessionId;
export const getExpectedError = (state: UIState) => state.app.expectedError;
export const getUnexpectedError = (state: UIState) => state.app.unexpectedError;
export const getTrialExpired = (state: UIState) => state.app.trialExpired;
export const getModal = (state: UIState) => state.app.modal;
export const getModalOptions = (state: UIState) => state.app.modalOptions;
export const getAnalysisPointsForLocation = (
  state: UIState,
  location: Location | null,
  condition = ""
) => {
  if (!location) {
    return undefined;
  }

  const key = getLocationAndConditionKey(location, condition);
  const points = state.app.analysisPoints[key];
  return points ? getPointsInTrimSpan(state, points) : undefined;
};

export const getHoveredLineNumberLocation = (state: UIState) => state.app.hoveredLineNumberLocation;
export const getPointsForHoveredLineNumber = (state: UIState) => {
  const location = getHoveredLineNumberLocation(state);
  return getAnalysisPointsForLocation(state, location);
};
const NO_EVENTS: MouseEvent[] = [];
export const getEventsForType = (state: UIState, type: string) =>
  state.app.events[type] || NO_EVENTS;

export const getFlatEvents = (state: UIState) => {
  let events: ReplayEvent[] = [];
  const focusRegion = getFocusRegion(state);

  Object.keys(state.app.events).map(
    (eventKind: EventKind) => (events = [...events, ...state.app.events[eventKind]])
  );

  const sortedEvents = events.sort((a: ReplayEvent, b: ReplayEvent) =>
    compareBigInt(BigInt(a.point), BigInt(b.point))
  );
  const filteredEventTypes = ["keydown", "keyup"];
  const filteredEvents = sortedEvents.filter(e => !filteredEventTypes.includes(e.kind));

  // Only show the events in the current focused region
  return focusRegion
    ? filteredEvents.filter(e => e.time > focusRegion.startTime && e.time < focusRegion.endTime)
    : filteredEvents;
};
export const getIsNodePickerActive = (state: UIState) => state.app.isNodePickerActive;
export const getIsNodePickerInitializing = (state: UIState) => state.app.isNodePickerInitializing;
export const getCanvas = (state: UIState) => state.app.canvas;
export const getVideoUrl = (state: UIState) => state.app.videoUrl;
export const getWorkspaceId = (state: UIState) => state.app.workspaceId;
export const getDefaultSettingsTab = (state: UIState) => state.app.defaultSettingsTab;
export const getRecordingTarget = (state: UIState) => state.app.recordingTarget;
export const getRecordingWorkspace = (state: UIState) => state.app.recordingWorkspace;
export const isRegionLoaded = (state: UIState, time: number | null | undefined) =>
  typeof time !== "number" || isTimeInRegions(time, getLoadedRegions(state)?.loaded);
export const getIsFocusing = (state: UIState) => getModal(state) === "focusing";
export const areMouseTargetsLoading = (state: UIState) => state.app.mouseTargetsLoading;
export const getCurrentPoint = (state: UIState) => state.app.currentPoint;
