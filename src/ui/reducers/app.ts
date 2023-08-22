import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

import { RecordingTarget } from "replay-next/src/suspense/BuildIdCache";
import { compareExecutionPoints, isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { Workspace } from "shared/graphql/types";
import { getActiveFocusWindow } from "ui/reducers/timeline";
import { UIState } from "ui/state";
import {
  AppMode,
  AppState,
  Canvas,
  EventKind,
  ExpectedError,
  ModalOptionsType,
  ModalType,
  NodePickerType,
  ReplayEvent,
  SettingsTabTitle,
  UnexpectedError,
  UploadInfo,
} from "ui/state/app";

export const initialAppState: AppState = {
  awaitingSourcemaps: false,
  canvas: null,
  currentPoint: null,
  defaultSettingsTab: "Preferences",
  displayedLoadingProgress: null,
  events: {},
  expectedError: null,
  activeNodePicker: null,
  nodePickerStatus: "disabled",
  loading: 4,
  loadingFinished: false,
  modal: null,
  modalOptions: null,
  mode: "devtools",
  mouseTargetsLoading: false,
  recordingDuration: 0,
  recordingTarget: null,
  recordingWorkspace: null,
  sessionId: null,
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
    setUploading(state, action: PayloadAction<UploadInfo | null>) {
      state.uploading = action.payload;
    },
    setAwaitingSourcemaps(state, action: PayloadAction<boolean>) {
      state.awaitingSourcemaps = action.payload;
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
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
    },
    setLoadingFinished(state, action: PayloadAction<boolean>) {
      state.loadingFinished = action.payload;
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
    loadReceivedEvents(state, action: PayloadAction<Record<EventKind, ReplayEvent[]>>) {
      // Load multiple event types into state at once
      Object.assign(state.events, action.payload);
    },
    nodePickerInitializing(state, action: PayloadAction<NodePickerType>) {
      state.activeNodePicker = action.payload;
      state.nodePickerStatus = "initializing";
    },
    nodePickerReady(state, action: PayloadAction<NodePickerType>) {
      if (state.activeNodePicker === action.payload && state.nodePickerStatus === "initializing") {
        state.nodePickerStatus = "active";
      }
    },
    nodePickerDisabled(state) {
      state.activeNodePicker = null;
      state.nodePickerStatus = "disabled";
    },
    setCanvas(state, action: PayloadAction<Canvas>) {
      state.canvas = action.payload;
    },
    setVideoUrl(state, action: PayloadAction<string>) {
      state.videoUrl = action.payload;
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
  setAppMode,
  setAwaitingSourcemaps,
  setCanvas,
  setCurrentPoint,
  setDefaultSettingsTab,
  loadReceivedEvents,
  setExpectedError,
  nodePickerDisabled,
  nodePickerInitializing,
  nodePickerReady,
  setLoadingFinished,
  setModal,
  setMouseTargetsLoading,
  setRecordingTarget,
  setRecordingWorkspace,
  setSessionId,
  setTrialExpired,
  setUnexpectedError,
  setUploading,
  setVideoUrl,
} = appSlice.actions;

export default appSlice.reducer;

// Copied from ./layout to avoid circles
const getSelectedPanel = (state: UIState) => state.layout.selectedPanel;
const getViewMode = (state: UIState) => state.layout.viewMode;

export const isInspectorSelected = (state: UIState) =>
  getViewMode(state) === "dev" && getSelectedPanel(state) == "inspector";
export const getRecordingDuration = (state: UIState) => state.app.recordingDuration;

export const getLoadingFinished = (state: UIState) => state.app.loadingFinished;
export const getUploading = (state: UIState) => state.app.uploading;
export const getAwaitingSourcemaps = (state: UIState) => state.app.awaitingSourcemaps;
export const getSessionId = (state: UIState) => state.app.sessionId;
export const getExpectedError = (state: UIState) => state.app.expectedError;
export const getUnexpectedError = (state: UIState) => state.app.unexpectedError;
export const getTrialExpired = (state: UIState) => state.app.trialExpired;
export const getModal = (state: UIState) => state.app.modal;
export const getModalOptions = (state: UIState) => state.app.modalOptions;

const NO_EVENTS: MouseEvent[] = [];
export const getEventsForType = (state: UIState, type: string) =>
  state.app.events[type] || NO_EVENTS;

export const getSortedEventsForDisplay = createSelector(
  (state: UIState) => state.app.events,
  events => {
    let sortedEvents: ReplayEvent[] = [];

    for (let [eventType, eventsOfType] of Object.entries(events)) {
      if (["keydown", "keyup"].includes(eventType)) {
        continue;
      }
      sortedEvents = sortedEvents.concat(eventsOfType);
    }

    sortedEvents.sort((a, b) => compareExecutionPoints(a.point, b.point));
    return sortedEvents;
  }
);

export const getFilteredEventsForFocusWindow = createSelector(
  getActiveFocusWindow,
  getSortedEventsForDisplay,
  (focusWindow, sortedEvents) => {
    if (!focusWindow) {
      return sortedEvents;
    }

    const filteredEvents = sortedEvents.filter(e => {
      return isExecutionPointsWithinRange(e.point, focusWindow.begin.point, focusWindow.end.point);
    });
    return filteredEvents;
  }
);

export const getIsNodePickerActive = (state: UIState) => state.app.nodePickerStatus === "active";
export const getIsNodePickerInitializing = (state: UIState) =>
  state.app.nodePickerStatus === "initializing";
export const getCanvas = (state: UIState) => state.app.canvas;
export const getVideoUrl = (state: UIState) => state.app.videoUrl;
export const getDefaultSettingsTab = (state: UIState) => state.app.defaultSettingsTab;
export const getRecordingTarget = (state: UIState) => state.app.recordingTarget;
export const getRecordingWorkspace = (state: UIState) => state.app.recordingWorkspace;
export const getAreMouseTargetsLoading = (state: UIState) => state.app.mouseTargetsLoading;
export const getCurrentPoint = (state: UIState) => state.app.currentPoint;
