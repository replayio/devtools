/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateRecordingWorkspace
// ====================================================

export interface UpdateRecordingWorkspace_updateRecordingWorkspace_recording_workspace {
  __typename: "Workspace";
  id: string;
}

export interface UpdateRecordingWorkspace_updateRecordingWorkspace_recording {
  __typename: "Recording";
  uuid: any;
  workspace: UpdateRecordingWorkspace_updateRecordingWorkspace_recording_workspace | null;
}

export interface UpdateRecordingWorkspace_updateRecordingWorkspace {
  __typename: "UpdateRecordingWorkspace";
  success: boolean | null;
  recording: UpdateRecordingWorkspace_updateRecordingWorkspace_recording;
}

export interface UpdateRecordingWorkspace {
  updateRecordingWorkspace: UpdateRecordingWorkspace_updateRecordingWorkspace;
}

export interface UpdateRecordingWorkspaceVariables {
  recordingId: string;
  workspaceId?: string | null;
}
