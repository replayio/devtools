import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { skipTelemetry } from "./environment";
import { Recording, Workspace } from "ui/types";
import { prefs } from "./prefs";
import { UserInfo } from "ui/hooks/users";
import { initializeMixpanel, trackMixpanelEvent } from "./mixpanel";

const timings: Record<string, number> = {};

export function setupTelemetry() {
  const ignoreList = [
    "Current thread has paused or resumed",
    "Current thread has changed",
    "Failed to load Stripe.js",
  ];
  // We always initialize mixpanel here. This allows us to force enable mixpanel events even if
  // telemetry events are being skipped for any reason, e.g. development, test, etc.
  initializeMixpanel();

  if (skipTelemetry()) {
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

export function registerRecording({ recording }: { recording?: Recording }) {
  if (!recording) {
    return;
  }
  Sentry.setContext("recording", { recordingId: recording.id, url: window.location.href });
}

export type TelemetryUser = {
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
}

export async function sendTelemetryEvent(event: string, tags: any = {}) {
  if (prefs.logTelemetryEvent) {
    console.log("telemetry event", { event, tags });
  }

  if (skipTelemetry()) {
    return;
  }

  try {
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

export function trackTiming(event: string, properties: any = {}) {
  let duration: number | undefined;
  if (!timings[event]) {
    timings[event] = Date.now();
  } else {
    duration = Date.now() - timings[event];
    delete timings[event];
  }

  sendTelemetryEvent(event, { duration, ...properties });
}

export const trackEvent = trackMixpanelEvent;
