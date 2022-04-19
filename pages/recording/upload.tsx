import React, { useEffect } from "react";
import LoadingScreen from "ui/components/shared/LoadingScreen";
import { BlankViewportWrapper } from "ui/components/shared/Viewport";
import UploadScreen from "ui/components/UploadScreen";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { useGetUserSettings } from "ui/hooks/settings";

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
    return <LoadingScreen />;
  }

  return recording ? (
    <UploadScreen userSettings={userSettings} recording={recording} onUpload={onUpload} />
  ) : (
    <BlankViewportWrapper />
  );
}

export default UploadScreenWrapper;
