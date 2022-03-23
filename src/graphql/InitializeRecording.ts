/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InitializeRecording
// ====================================================

export interface InitializeRecording_initializeRecording_recording_workspace {
  __typename: "Workspace";
  id: string;
}

export interface InitializeRecording_initializeRecording_recording {
  __typename: "Recording";
  uuid: any;
  isInitialized: boolean;
  title: string | null;
  workspace: InitializeRecording_initializeRecording_recording_workspace | null;
}

export interface InitializeRecording_initializeRecording {
  __typename: "InitializeRecording";
  success: boolean | null;
  recording: InitializeRecording_initializeRecording_recording | null;
}

export interface InitializeRecording {
  initializeRecording: InitializeRecording_initializeRecording;
}

export interface InitializeRecordingVariables {
  recordingId: string;
  title: string;
  workspaceId?: string | null;
}
