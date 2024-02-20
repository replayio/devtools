import { SessionId } from "@replayio/protocol";

import { getRecordingId } from "shared/utils/recording";

export async function submitSupportForm(
  sessionId: SessionId | null,
  text: string,
  currentUser: null | {
    email: string;
    id: string;
    name: string;
  }
) {
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
