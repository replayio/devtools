import React from "react";
import hooks from "ui/hooks";
import { TrialEnd } from "../shared/TrialEnd";

export function RecordingTrialEnd() {
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);

  if (loading || !recording?.workspace?.subscription?.trialEnds) {
    return null;
  }

  return <TrialEnd trialEnds={recording.workspace.subscription.trialEnds} color="yellow" />;
}
