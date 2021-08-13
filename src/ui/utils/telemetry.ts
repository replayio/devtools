import mixpanel from "mixpanel-browser";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { skipTelemetry } from "./environment";

export function setupTelemetry() {
  const ignoreList = ["Current thread has paused or resumed", "Current thread has changed"];
  mixpanel.init("ffaeda9ef8fb976a520ca3a65bba5014");

  if (skipTelemetry()) {
    mixpanel.disable();
    return;
  }

  Sentry.init({
    dsn: "https://41c20dff316f42fea692ef4f0d055261@o437061.ingest.sentry.io/5399075",
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
    release: process.env.REPLAY_RELEASE ? process.env.REPLAY_RELEASE : "development",
    beforeSend(event) {
      if (event) {
        const exceptionValue = event?.exception?.values?.[0].value;
        if (ignoreList.some(ignore => exceptionValue?.includes(ignore))) {
          return null;
        }
      }

      return event;
    },
  });
}

export function registerRecording(recordingId: string) {
  mixpanel.register({ recordingId });
  Sentry.setContext("recording", { recordingId, url: window.location.href });
}

type TelemetryUser = {
  id: string | undefined;
  email: string | undefined;
  internal: boolean;
};

let telemetryUser: TelemetryUser | undefined;

export function setTelemetryContext({ id, email, internal }: TelemetryUser) {
  telemetryUser = { id, email, internal };
  Sentry.setTag("userInternal", internal);
  if (id && email) {
    Sentry.setUser({ id, email });
    Sentry.setTag("userEmail", email);
    Sentry.setTag("anonymous", false);
  } else {
    Sentry.setTag("anonymous", true);
  }

  if (id) {
    mixpanel.identify(id);
  }

  if (email) {
    mixpanel.people.set({ $email: email });
  }
}

export async function sendTelemetryEvent(event: string, tags: any = {}) {
  try {
    if (skipTelemetry()) {
      return;
    }
    const response = await fetch("https://telemetry.replay.io/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, ...tags, user: telemetryUser }),
    });
    if (!response.ok) {
      console.error(`Sent telemetry event ${event} but got status code ${response.status}`);
    }
  } catch (e) {
    console.error(`Couldn't send telemetry event ${event}`, e);
  }
}
