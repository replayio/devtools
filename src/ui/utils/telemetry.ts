import mixpanel from "mixpanel-browser";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { isDevelopment, skipTelemetry } from "./environment";
import { Recording, Workspace } from "ui/types";
import { isTest } from "./environment";
import { prefs } from "./prefs";
import { UserInfo } from "ui/hooks/users";

let mixpanelDisabled = false;

export function setupTelemetry() {
  const ignoreList = ["Current thread has paused or resumed", "Current thread has changed"];
  mixpanel.init("ffaeda9ef8fb976a520ca3a65bba5014");

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

export function registerRecording({
  recording,
  userInfo,
}: {
  recording?: Recording;
  userInfo?: Omit<UserInfo, "loading">;
}) {
  if (!recording) {
    return;
  }

  Sentry.setContext("recording", { recordingId: recording.id, url: window.location.href });

  if (
    !prefs.logTelemetryEvent &&
    (recording.user?.internal || userInfo?.internal || skipTelemetry())
  ) {
    mixpanelDisabled = true;
  } else {
    mixpanel.register({ recordingId: recording.id });
  }
}

type TelemetryUser = {
  id: string | undefined;
  email: string | undefined;
  internal: boolean;
};

let telemetryUser: TelemetryUser | undefined;
let workspaceContext: Workspace | undefined;

export function setWorkspaceContext(workspace: Workspace) {
  workspaceContext = workspace;
}

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

  if (!mixpanelDisabled && id) {
    mixpanel.identify(id);
  }

  if (!mixpanelDisabled && email) {
    mixpanel.people.set({ $email: email });
  }
}

export async function sendTelemetryEvent(event: string, tags: any = {}) {
  if (!prefs.logTelemetryEvent && skipTelemetry()) {
    return;
  }

  if (prefs.logTelemetryEvent) {
    console.log("telemetry event", { event, tags });
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

export async function trackEvent(event: string, additionalContext?: Object) {
  // we should be able to opt-in to logging telemetry events in development
  if (mixpanelDisabled || (!prefs.logTelemetryEvent && (isTest() || isDevelopment()))) {
    return;
  }

  const context = {
    workspace: workspaceContext?.name || "",
    ...additionalContext,
  };

  if (prefs.logTelemetryEvent) {
    console.log("🔴", event, context);
  }

  mixpanel.track(event, context);
}
