import mixpanel from "mixpanel-browser";
import * as Sentry from "@sentry/react";

export function setTelemetryContext(
  userId: string | undefined,
  userEmail: string | undefined,
  isInternal: boolean
) {
  let sentryContext: Record<string, string | boolean> = { isInternal };
  if (userId) {
    mixpanel.identify(userId);
    sentryContext["userId"] = userId;
  }

  if (userEmail) {
    mixpanel.people.set({ $email: userEmail });
    sentryContext["userEmail"] = userEmail;
  }

  Sentry.setContext("user", sentryContext);
}

export async function sendTelemetryEvent(event: string, tags: any = {}) {
  try {
    const response = await fetch("https://telemetry.replay.io/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, ...tags }),
    });
    if (!response.ok) {
      console.error(`Sent telemetry event ${event} but got status code ${response.status}`);
    }
  } catch (e) {
    console.error(`Couldn't send telemetry event ${event}`, e);
  }
}
