import { SessionId } from "@replayio/protocol";

import { SupportFormContext } from "replay-next/components/errors/SupportContext";
import { getRecordingId } from "shared/utils/recording";

export async function submitSupportForm({
  context,
  currentUser,
  sessionId,
  shareWithReplaySupport,
  text,
}: {
  context: SupportFormContext;
  currentUser: null | {
    email: string;
    id: string;
    name: string | null;
  };
  sessionId: SessionId | null;
  shareWithReplaySupport: boolean;
  text: string;
}) {
  // TODO [PRO-698] Replace Form Carry with Honeycomb and pass along context

  const result = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    // FormCarry does not support nested values
    body: JSON.stringify({
      date: new Date(),
      recordingId: getRecordingId(),
      sessionId,
      text,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userEmail: currentUser?.email,
      userId: currentUser?.id,
      userName: currentUser?.name,
    }),
  });

  if (result.status >= 400) {
    const text = await result.text();

    throw Error(text);
  }
}
