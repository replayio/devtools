import React from "react";
import hooks from "ui/hooks";
import { TrialEnd } from "../shared/TrialEnd";
import { subscriptionEndsIn, inUnpaidFreeTrial } from "ui/utils/workspace";

export function RecordingTrialEnd() {
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);

  const workspace = recording?.workspace;
  if (loading || !workspace || !inUnpaidFreeTrial(workspace)) {
    return null;
  }

  const expiresIn = subscriptionEndsIn(workspace);

  return <TrialEnd expiresIn={expiresIn} color="yellow" />;
}
