import React from "react";
import hooks from "ui/hooks";
import { TrialEnd } from "../shared/TrialEnd";
import { freeTrialExpiresIn, inUnpaidFreeTrial } from "ui/utils/workspace";

export function RecordingTrialEnd() {
  const recordingId = hooks.useGetRecordingId();
  const { recording, loading } = hooks.useGetRecording(recordingId);

  const subscription = recording?.workspace?.subscription;
  console.log({ subscription });
  if (loading || !subscription || !inUnpaidFreeTrial(subscription)) {
    return null;
  }

  const expiresIn = freeTrialExpiresIn(subscription);
  console.log({ subscription, expiresIn });

  return <TrialEnd expiresIn={expiresIn} color="yellow" />;
}
