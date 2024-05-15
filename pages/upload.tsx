import React, { useEffect, useState } from "react";

import { RecordingTarget, getRecordingTarget } from "replay-next/src/suspense/BuildIdCache";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import { BlankViewportWrapper } from "ui/components/shared/Viewport";
import UploadScreen from "ui/components/UploadScreen";
import { useGetRecording, useGetRecordingId, useInitializeRecording } from "ui/hooks/recordings";
import { useGetUserSettings } from "ui/hooks/settings";
import { useGetNonPendingWorkspaces } from "ui/hooks/workspaces";

function UploadScreenWrapper({ onUpload }: { onUpload: () => void }) {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  // Make sure to get the user's settings and workspaces before showing the upload screen.
  const { userSettings, loading: userSettingsLoading } = useGetUserSettings();
  const { workspaces, loading: workspacesLoading } = useGetNonPendingWorkspaces();
  const initializeRecording = useInitializeRecording();
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (recording?.isInitialized) {
      window.onbeforeunload = null;
    }
  });

  useEffect(() => {
    async function initialize() {
      await initializeRecording({
        variables: { recordingId, title: recording?.title || "Untitled", workspaceId: null },
      });
      onUpload();
    }
    if (
      recording?.isInitialized === false &&
      !initializing &&
      !workspacesLoading &&
      workspaces.length === 0 &&
      getRecordingTarget(recording.buildId ?? "unknown") !== RecordingTarget.gecko
    ) {
      setInitializing(true);
      initialize();
    }
  }, [
    initializeRecording,
    initializing,
    onUpload,
    recording,
    recordingId,
    workspacesLoading,
    workspaces,
  ]);

  if (userSettingsLoading || workspacesLoading || initializing) {
    return <LoadingScreen message="Loading..." />;
  }

  return recording ? (
    <UploadScreen
      userSettings={userSettings}
      workspaces={workspaces}
      recording={recording}
      onUpload={onUpload}
    />
  ) : (
    <BlankViewportWrapper />
  );
}

export default UploadScreenWrapper;
