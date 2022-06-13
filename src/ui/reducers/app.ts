import { Location } from "@replayio/protocol";
import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecordingTarget } from "protocol/thread/thread";
import { getSystemColorSchemePreference } from "ui/utils/environment";
import { getCurrentTime, getFocusRegion, getZoomRegion } from "ui/reducers/timeline";
import { UIState } from "ui/state";
import {
  AppState,
  AppTheme,
  EventKind,
  ReplayEvent,
  UploadInfo,
  LoadedRegions,
  ExpectedError,
  UnexpectedError,
  ModalOptionsType,
  ModalType,
  Canvas,
  SettingsTabTitle,
  AppMode,
} from "ui/state/app";
import { PanelName } from "ui/state/layout";
import { Workspace } from "ui/types";
import { getNonLoadingRegionTimeRanges } from "ui/utils/app";
import { compareBigInt } from "ui/utils/helpers";
import { prefs } from "ui/utils/prefs";
import {
  displayedEndForFocusRegion,
  isPointInRegions,
  isTimeInRegions,
  overlap,
  displayedBeginForFocusRegion,
} from "ui/utils/timeline";

export const initialAppState: AppState = {
  // analysisPoints: {},
  awaitingSourcemaps: false,
  canvas: null,
  currentPoint: null,
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
  loadingStatusSlow: false,
  modal: null,
  modalOptions: null,
  mode: "devtools",
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
};

const appSlice = createSlice({
  name: "app",
  initialState: initialAppState,
  reducers: {
    setMouseTargetsLoading(state, action: PayloadAction<boolean>) {
      state.mouseTargetsLoading = action.payload;
    },
    setRecordingDuration(state, action: PayloadAction<number>) {
      state.recordingDuration = action.payload;
    },
    setUploading(state, action: PayloadAction<UploadInfo | null>) {
      state.uploading = action.payload;
    },
    setAwaitingSourcemaps(state, action: PayloadAction<boolean>) {
      state.awaitingSourcemaps = action.payload;
    },
    setLoadedRegions(state, action: PayloadAction<LoadedRegions>) {
      const recordingDuration = Math.max(
        ...action.payload.loading.map(r => r.end.time),
        state.recordingDuration
      );
      state.loadedRegions = action.payload;
      state.recordingDuration = recordingDuration;

      // This is inferred by an interval that checks the amount of time since the last update.
      // Whenever a new update comes in, this state should be reset.
      state.loadingStatusSlow = false;
    },
    setExpectedError(state, action: PayloadAction<ExpectedError>) {
      state.expectedError = action.payload;
      state.modal = null;
      state.modalOptions = null;
    },
    setUnexpectedError(state, action: PayloadAction<UnexpectedError>) {
      state.unexpectedError = action.payload;
      state.modal = null;
      state.modalOptions = null;
    },
    clearExpectedError(state) {
      state.expectedError = null;
      state.modal = null;
      state.modalOptions = null;
    },
    setTrialExpired(state, action: PayloadAction<boolean | undefined>) {
      state.trialExpired = action.payload ?? true;
    },
    updateTheme(state, action: PayloadAction<AppTheme>) {
      state.theme = action.payload;
    },
    setInitializedPanels(state, action: PayloadAction<PanelName>) {
      state.initializedPanels.push(action.payload);
    },
    setLoading(state, action: PayloadAction<number>) {
      state.loading = action.payload;
    },
    setDisplayedLoadingProgress(state, action: PayloadAction<number | null>) {
      state.displayedLoadingProgress = action.payload;
    },
    setLoadingFinished(state, action: PayloadAction<boolean>) {
      state.loadingFinished = action.payload;

      // This is inferred by an interval that checks the amount of time since the last update.
      // Whenever a new update comes in, this state should be reset.
      state.loadingStatusSlow = false;
    },
    setLoadingStatusSlow(state, action: PayloadAction<boolean>) {
      state.loadingStatusSlow = action.payload;
    },
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
    },
    setModal: {
      reducer(
        state,
        action: PayloadAction<{ modal: ModalType | null; options: ModalOptionsType }>
      ) {
        state.modal = action.payload.modal;
        state.modalOptions = action.payload.options;
      },
      prepare(modal: ModalType | null, options: ModalOptionsType = null) {
        return {
          payload: { modal, options },
        };
      },
    },
    setEventsForType(
      state,
      action: PayloadAction<{
        events: ReplayEvent[];
        eventType: EventKind;
      }>
    ) {
      const { events, eventType } = action.payload;
      state.events[eventType] = events;
    },
    setHoveredLineNumberLocation(state, action: PayloadAction<Location | null>) {
      state.hoveredLineNumberLocation = action.payload;
    },
    setIsNodePickerActive(state, action: PayloadAction<boolean>) {
      state.isNodePickerActive = action.payload;
    },
    setIsNodePickerInitializing(state, action: PayloadAction<boolean>) {
      state.isNodePickerInitializing = action.payload;
    },
    setCanvas(state, action: PayloadAction<Canvas>) {
      state.canvas = action.payload;
    },
    setVideoUrl(state, action: PayloadAction<string>) {
      state.videoUrl = action.payload;
    },
    setWorkspaceId(state, action: PayloadAction<string | null>) {
      state.workspaceId = action.payload;
    },
    setDefaultSettingsTab(state, action: PayloadAction<SettingsTabTitle>) {
      state.defaultSettingsTab = action.payload;
    },
    setRecordingTarget(state, action: PayloadAction<RecordingTarget>) {
      state.recordingTarget = action.payload;
    },
    setRecordingWorkspace(state, action: PayloadAction<Workspace>) {
      state.recordingWorkspace = action.payload;
    },
    setCurrentPoint(state, action: PayloadAction<string | null>) {
      state.currentPoint = action.payload;
    },
    setAppMode(state, action: PayloadAction<AppMode>) {
      state.mode = action.payload;
    },
  },
});

export const {
  clearExpectedError,
  setMouseTargetsLoading,
  setAppMode,
  setAwaitingSourcemaps,
  setCanvas,
  setCurrentPoint,
  setDefaultSettingsTab,
  setDisplayedLoadingProgress,
  setEventsForType,
  setExpectedError,
  setHoveredLineNumberLocation,
  setInitializedPanels,
  setIsNodePickerActive,
  setIsNodePickerInitializing,
  setLoadedRegions,
  setLoading,
  setLoadingFinished,
  setLoadingStatusSlow,
  setModal,
  setRecordingDuration,
  setRecordingTarget,
  setRecordingWorkspace,
  setSessionId,
  setTrialExpired,
  setUnexpectedError,
  setUploading,
  setVideoUrl,
  setWorkspaceId,
  updateTheme,
} = appSlice.actions;

export default appSlice.reducer;

// Copied from ./layout to avoid circles
const getSelectedPanel = (state: UIState) => state.layout.selectedPanel;
const getViewMode = (state: UIState) => state.layout.viewMode;

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
export const getLoadingStatusSlow = (state: UIState) => state.app.loadingStatusSlow;
export const getLoadedRegions = (state: UIState) => state.app.loadedRegions;
export const getIndexedAndLoadedRegions = createSelector(getLoadedRegions, loadedRegions => {
  if (!loadedRegions) {
    return [];
  }
  return overlap(loadedRegions.indexed, loadedRegions.loaded);
});

// Calculates the percentage of loading regions that have been loaded and indexed.
//
// For example:
// If 80% of the regions have been indexed and 50% have been loaded, this method would return 0.65.
// If 100% of the regions have been indexed and 50% have been loaded, this method would return 0.75.
export const getLoadedAndIndexedProgress = createSelector(getLoadedRegions, regions => {
  if (!regions) {
    return 0;
  }

  const { indexed, loaded, loading } = regions;
  if (indexed == null || loaded == null || loading == null) {
    return 0;
  }

  const totalLoadingTime = loading.reduce((totalTime, { begin, end }) => {
    return totalTime + end.time - begin.time;
  }, 0);

  if (totalLoadingTime === 0) {
    return 0;
  }

  const totalLoadedTime = loaded.reduce((totalTime, { begin, end }) => {
    return totalTime + end.time - begin.time;
  }, 0);
  const totalIndexedTime = indexed.reduce((totalTime, { begin, end }) => {
    return totalTime + end.time - begin.time;
  }, 0);

  return (totalLoadedTime + totalIndexedTime) / (totalLoadingTime * 2);
});

export const getIsIndexed = createSelector(getLoadedAndIndexedProgress, progress => progress === 1);

export const getNonLoadingTimeRanges = (state: UIState) => {
  const loadingRegions = getLoadedRegions(state)?.loading || [];
  const endTime = getZoomRegion(state).endTime;

  return getNonLoadingRegionTimeRanges(loadingRegions, endTime);
};
export const getIsInLoadedRegion = createSelector(
  getLoadedRegions,
  (state: UIState) => state.pause.executionPoint,
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

export const getHoveredLineNumberLocation = (state: UIState) => state.app.hoveredLineNumberLocation;

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
    ? filteredEvents.filter(
        e =>
          e.time > displayedBeginForFocusRegion(focusRegion) &&
          e.time < displayedEndForFocusRegion(focusRegion)
      )
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
export const getAreMouseTargetsLoading = (state: UIState) => state.app.mouseTargetsLoading;
export const getCurrentPoint = (state: UIState) => state.app.currentPoint;

export const isCurrentTimeInLoadedRegion = createSelector(
  getCurrentTime,
  getLoadedRegions,
  (currentTime: number, regions: LoadedRegions | null) => {
    return (
      regions !== null &&
      regions.loaded.some(({ begin, end }) => currentTime >= begin.time && currentTime <= end.time)
    );
  }
);
