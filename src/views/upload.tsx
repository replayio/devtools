import React, { useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import { setExpectedError } from "ui/actions/session";
import { useGetRecording, useHasExpectedError } from "ui/hooks/recordings";
import { useGetUserSettings } from "ui/hooks/settings";
import { BlankLoadingScreen } from "ui/components/shared/BlankScreen";
import UploadScreen from "ui/components/UploadScreen";

const url = new URL(window.location.href);
const recordingId = url.searchParams.get("id")!;

function _UploadScreenWrapper({ setExpectedError }: PropsFromRedux) {
  const expectedError = useHasExpectedError(recordingId);
  const { recording } = useGetRecording(recordingId);
  // Make sure to get the user's settings before showing the upload screen.
  const { userSettings, loading } = useGetUserSettings();

  useEffect(() => {
    if (expectedError) {
      setExpectedError(expectedError);
    }
  }, [expectedError]);

  useEffect(() => {
    if (recording?.isInitialized) {
      window.onbeforeunload = null;
      document.location.reload();
    }
  });

  if (expectedError || loading) {
    return <BlankLoadingScreen />;
  }

  return recording ? <UploadScreen {...{ userSettings, recording }} /> : <BlankLoadingScreen />;
}

const connector = connect(null, { setExpectedError });
type PropsFromRedux = ConnectedProps<typeof connector>;
const UploadScreenWrapper = connector(_UploadScreenWrapper);
export default UploadScreenWrapper;
