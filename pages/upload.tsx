import React, { useEffect } from "react";

import LoadingScreen from "ui/components/shared/LoadingScreen";
import { BlankViewportWrapper } from "ui/components/shared/Viewport";
import UploadScreen from "ui/components/UploadScreen";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserSettings } from "ui/hooks/settings";
import { useGetNonPendingWorkspaces } from "ui/hooks/workspaces";

function UploadScreenWrapper({ onUpload }: { onUpload: () => void }) {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  // Make sure to get the user's settings and workspaces before showing the upload screen.
  const { userSettings, loading: userSettingsLoading } = useGetUserSettings();
  const { workspaces, loading: pendingWorkspacesLoading } = useGetNonPendingWorkspaces();

  useEffect(() => {
    if (recording?.isInitialized) {
      window.onbeforeunload = null;
    }
  });

  if (userSettingsLoading || pendingWorkspacesLoading) {
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
