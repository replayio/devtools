import React from "react";
import hooks from "ui/hooks";
import { subscriptionEndsIn, inUnpaidFreeTrial } from "ui/utils/workspace";

import { TrialEnd } from "../shared/TrialEnd";

export function RecordingTrialEnd() {
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);

  const workspace = recording?.workspace;
  if (loading || !workspace || !inUnpaidFreeTrial(workspace) || workspace.hasPaymentMethod) {
    return null;
  }

  const expiresIn = subscriptionEndsIn(workspace);

  return <TrialEnd expiresIn={expiresIn} color="yellow" />;
}
