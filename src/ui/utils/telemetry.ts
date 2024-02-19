import { extraErrorDataIntegration } from "@sentry/integrations";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import { recordData as recordTelemetryData } from "replay-next/src/utils/telemetry";
import { Recording } from "shared/graphql/types";
import { userData } from "shared/user-data/GraphQL/UserData";
import { skipTelemetry } from "shared/utils/environment";

import { initializeMixpanel, trackMixpanelEvent } from "./mixpanel";

const timings: Record<string, number> = {};

export function setupTelemetry() {
  const ignoreList = [
    // network problems
    "Failed to load Stripe.js",
    "Stripe.js not available",
    "A network error occurred.",
    "NetworkError when attempting to fetch resource.",
    "Response not successful: Received status code 500",
    "Response not successful: Received status code 401",
    "NetworkError: Load failed",
    "3000ms timeout exceeded",
    "Failed to fetch",
    // error messages from the backend
    "The session is unknown or has been destroyed",
    "The session was destroyed while the command was in progress",
    "Internal error",
    "Failed to perform command",
    "Operation timed out",
    "The focus range was changed while the command was in progress",
    // expected error from ReplayClient
    "Too many points",
    // sporadic error from an apollo dependency
    "already recomputing",
    // sporadic error from asyncStorage, only happens in Mobile Safari
    "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.",
    // this error seems to be triggered by some Office 365 bot,
    // see https://github.com/getsentry/sentry-javascript/issues/3440
    "Object Not Found Matching Id:",
    // sporadic errors from Next.js
    "Failed to execute 'measure' on 'Performance'",
    "Cannot read properties of undefined (reading 'digest')",
    'can\'t access property "digest", t is undefined',
  ];
  // We always initialize mixpanel here. This allows us to force enable mixpanel events even if
  // telemetry events are being skipped for any reason, e.g. development, test, etc.
  initializeMixpanel();

  if (skipTelemetry()) {
    return;
  }

  Sentry.init({
    dsn: "https://41c20dff316f42fea692ef4f0d055261@o437061.ingest.sentry.io/5399075",
    integrations: [new Integrations.BrowserTracing(), extraErrorDataIntegration({ depth: 6 })],
    normalizeDepth: 7,
    tracesSampleRate: 1.0,
    release: process.env.REPLAY_RELEASE ? process.env.REPLAY_RELEASE : "development",
    beforeSend(event) {
      if (event) {
        const exception = event.exception?.values?.[0];
        if (exception) {
          if (ignoreList.some(ignore => exception.value?.includes(ignore))) {
            return null;
          }
          // Chrome sends errors from the browser console to window.onerror and hence
          // to Sentry, we try to detect these and filter them out.
          // See https://github.com/getsentry/sentry-javascript/issues/5179
          if (exception.stacktrace?.frames?.length === 1) {
            const frame = exception.stacktrace.frames[0];
            if (
              frame.function === "?" &&
              (frame.filename === "<anonymous>" || frame.filename === window.location.href)
            ) {
              return null;
            }
          }
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

export function sendTelemetryEvent(event: string, tags: any = {}) {
  if (userData.get("global_logTelemetryEvent")) {
    console.log("telemetry event", { event, tags });
  }

  if (skipTelemetry()) {
    return;
  }

  recordTelemetryData(event, { ...tags, user: telemetryUser });
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
