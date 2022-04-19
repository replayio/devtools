import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { Recording } from "ui/types";

import { skipTelemetry } from "./environment";
import { initializeMixpanel, trackMixpanelEvent } from "./mixpanel";
import { prefs } from "./prefs";
import { pingTelemetry } from "./replay-telemetry";

const timings: Record<string, number> = {};

export function setupTelemetry() {
  const ignoreList = [
    "Current thread has paused or resumed",
    "Current thread has changed",
    "Failed to load Stripe.js",
    "Stripe.js not available",
    "Received status code 500",
  ];
  // We always initialize mixpanel here. This allows us to force enable mixpanel events even if
  // telemetry events are being skipped for any reason, e.g. development, test, etc.
  initializeMixpanel();

  if (skipTelemetry()) {
    return;
  }

  Sentry.init({
    beforeSend(event) {
      if (event) {
        const exceptionValue = event?.exception?.values?.[0].value;
        if (ignoreList.some(ignore => exceptionValue?.includes(ignore))) {
          return null;
        }
      }

      return event;
    },
    dsn: "https://41c20dff316f42fea692ef4f0d055261@o437061.ingest.sentry.io/5399075",
    integrations: [new Integrations.BrowserTracing()],
    release: process.env.REPLAY_RELEASE ? process.env.REPLAY_RELEASE : "development",
    tracesSampleRate: 1.0,
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
  telemetryUser = { email, id, internal };
  Sentry.setTag("userInternal", internal);
  if (id && email) {
    Sentry.setUser({ email, id });
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

  pingTelemetry(event, { ...tags, user: telemetryUser });
}

export function trackTiming(event: string, properties: any = {}) {
  let duration: number | undefined;
  if (!timings[event]) {
    timings[event] = Date.now();
  } else {
    duration = Date.now() - timings[event];
    delete timings[event];
    sendTelemetryEvent(event, { duration, ...properties });
  }
}

export const trackEvent = trackMixpanelEvent;
