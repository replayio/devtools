import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RecordingId } from "@replayio/protocol";

import { RecordingTarget } from "replay-next/src/suspense/BuildIdCache";
import { Workspace } from "shared/graphql/types";
import { getMutableParamsFromURL } from "ui/setup/dynamic/url";
import { UIState } from "ui/state";
import {
  AppMode,
  AppState,
  ExpectedError,
  ModalOptionsType,
  ModalType,
  SettingsTabTitle,
  UnexpectedError,
  UploadInfo,
} from "ui/state/app";

const { commentId } = getMutableParamsFromURL();

export const initialAppState: AppState = {
  accessToken: null,
  awaitingSourcemaps: false,
  defaultSelectedReactElementId: null,
  defaultSettingsTab: "Preferences",
  displayedLoadingProgress: null,
  expectedError: null,
  hoveredCommentId: null,
  loading: 4,
  loadingFinished: false,
  modal: null,
  modalOptions: null,
  mode: "devtools",
  processing: null,
  processingProgress: null,
  recordingId: null,
  recordingTarget: null,
  recordingWorkspace: null,
  selectedCommentId: commentId,
  sessionId: null,
  unexpectedError: null,
  uploading: null,
  workspaceId: null,
};

const appSlice = createSlice({
  name: "app",
  initialState: initialAppState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    setRecordingId(state, action: PayloadAction<RecordingId>) {
      state.recordingId = action.payload;
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
    setDefaultSelectedReactElementId(state, action: PayloadAction<number | null>) {
      state.defaultSelectedReactElementId = action.payload;
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
    setAppMode(state, action: PayloadAction<AppMode>) {
      state.mode = action.payload;
    },
    setHoveredCommentId(state, action: PayloadAction<string | null>) {
      state.hoveredCommentId = action.payload;
    },
    setSelectedCommentId(state, action: PayloadAction<string | null>) {
      state.selectedCommentId = action.payload;
    },
    setProcessing(state, action: PayloadAction<boolean>) {
      state.processing = action.payload;
    },
    setProcessingProgress(state, action: PayloadAction<number>) {
      state.processingProgress = action.payload;
    },
  },
});

export const {
  setAccessToken,
  setRecordingId,
  clearExpectedError,
  setAppMode,
  setAwaitingSourcemaps,
  setDefaultSelectedReactElementId,
  setDefaultSettingsTab,
  setExpectedError,
  setLoadingFinished,
  setModal,
  setRecordingTarget,
  setRecordingWorkspace,
  setSessionId,
  setUnexpectedError,
  setUploading,
  setHoveredCommentId,
  setSelectedCommentId,
  setProcessing,
  setProcessingProgress,
} = appSlice.actions;

export default appSlice.reducer;

// Copied from ./layout to avoid circles
const getSelectedPanel = (state: UIState) => state.layout.selectedPanel;
const getViewMode = (state: UIState) => state.layout.viewMode;

export const getAccessToken = (state: UIState) => state.app.accessToken;
export const getRecordingId = (state: UIState) => state.app.recordingId;
export const isInspectorSelected = (state: UIState) =>
  getViewMode(state) === "dev" && getSelectedPanel(state) == "inspector";

export const getLoadingFinished = (state: UIState) => state.app.loadingFinished;
export const getUploading = (state: UIState) => state.app.uploading;
export const getAwaitingSourcemaps = (state: UIState) => state.app.awaitingSourcemaps;
export const getSessionId = (state: UIState) => state.app.sessionId;
export const getExpectedError = (state: UIState) => state.app.expectedError;
export const getUnexpectedError = (state: UIState) => state.app.unexpectedError;
export const getModal = (state: UIState) => state.app.modal;
export const getModalOptions = (state: UIState) => state.app.modalOptions;
export const getHoveredCommentId = (state: UIState) => state.app.hoveredCommentId;
export const getDefaultSelectedReactElementId = (state: UIState) =>
  state.app.defaultSelectedReactElementId;
export const getSelectedCommentId = (state: UIState) => state.app.selectedCommentId;

export const getDefaultSettingsTab = (state: UIState) => state.app.defaultSettingsTab;
export const getRecordingTarget = (state: UIState) => state.app.recordingTarget;
export const getRecordingWorkspace = (state: UIState) => state.app.recordingWorkspace;
export const getProcessing = (state: UIState) => state.app.processing;
export const getProcessingProgress = (state: UIState) => state.app.processingProgress;
