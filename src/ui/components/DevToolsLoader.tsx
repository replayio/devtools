import { RecordingId } from "@recordreplay/protocol";
import React from "react";
import hooks from "ui/hooks";
import DevToolsUserAuthenticator from "./DevToolsUserAuthenticator";
import { BlankLoadingScreen } from "./shared/BlankScreen";

export default function DevToolsLoader({ recordingId }: { recordingId: RecordingId }) {
  const { recording, isAuthorized, loading: recordingQueryLoading } = hooks.useGetRecording(
    recordingId
  );
  const { loading: settingsQueryLoading } = hooks.useGetUserSettings();
  const { userId: cachedUserId, loading: userIdQueryLoading } = hooks.useGetUserId();

  if (recordingQueryLoading || settingsQueryLoading || userIdQueryLoading) {
    return <BlankLoadingScreen />;
  }

  return (
    <DevToolsUserAuthenticator
      userId={cachedUserId}
      recording={recording!}
      isAuthorized={isAuthorized}
    />
  );
}
