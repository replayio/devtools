import React, { useEffect } from "react";
import hooks from "../hooks";

import { RecordingId } from "@recordreplay/protocol";
import { BlankLoadingScreen } from "./shared/BlankScreen";
import DevTools from "./DevTools";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";

type DevToolsLoaderProps = PropsFromRedux & { recordingId: RecordingId };

function DevToolsLoader({ recordingId, setExpectedError }: DevToolsLoaderProps) {
  const { recording, expectedError, loading: recordingQueryLoading } = hooks.useGetRecording(
    recordingId
  );
  const { userId, loading: userIdQueryLoading } = hooks.useGetUserId();
  const { loading: settingsQueryLoading } = hooks.useGetUserSettings();

  const queriesAreLoading = recordingQueryLoading || settingsQueryLoading || userIdQueryLoading;

  useEffect(() => {
    if (expectedError) {
      setExpectedError(expectedError);
    }
  }, [expectedError]);

  // In the case that there's an expected error, we show a blank loading screen here.
  // The useEffect then makes sure we set that error in state, where it's handled
  // in this component's parent component. That displays the error modal, which overlays
  // on top of this loading screen.
  if (queriesAreLoading || expectedError || !recording) {
    return <BlankLoadingScreen />;
  }

  return <DevTools recording={recording} userId={userId} />;
}

const connector = connect(() => ({}), {
  setExpectedError: actions.setExpectedError,
});
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(DevToolsLoader);
