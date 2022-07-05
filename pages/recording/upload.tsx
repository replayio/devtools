import React, { useEffect } from "react";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserSettings } from "ui/hooks/settings";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import UploadScreen from "ui/components/UploadScreen";
import { BlankViewportWrapper } from "ui/components/shared/Viewport";

function UploadScreenWrapper({ onUpload }: { onUpload: () => void }) {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  // Make sure to get the user's settings before showing the upload screen.
  const { userSettings, loading } = useGetUserSettings();

  useEffect(() => {
    if (recording?.isInitialized) {
      window.onbeforeunload = null;
    }
  });

  if (loading) {
    return <LoadingScreen fallbackMessage="Loading settings..." />;
  }

  return recording ? (
    <UploadScreen userSettings={userSettings} recording={recording} onUpload={onUpload} />
  ) : (
    <BlankViewportWrapper />
  );
}

export default UploadScreenWrapper;
