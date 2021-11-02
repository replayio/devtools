import mixpanel from "mixpanel-browser";
import { ViewMode } from "ui/state/app";
import { getRecordingId } from "./environment";
import { prefs } from "./prefs";
import { TelemetryUser } from "./telemetry";

const QA_EMAIL_ADDRESSES = ["mock@user.io"];

export let mixpanelDisabled = false;
const enableMixpanel = () => (mixpanelDisabled = false);
const disableMixpanel = () => (mixpanelDisabled = true);

export function initializeMixpanel() {
  // This init event becomes our Session Start point.
  mixpanel.init("ffaeda9ef8fb976a520ca3a65bba5014");
  trackEvent("session-start");
  setupSessionEndListener();

  // Add the recordingId to the event metadata so we have a cookie crumb
  // trail for following flows in LogRocket.
  mixpanel.register({ recordingId: getRecordingId() });
}

export function maybeSetMixpanelContext(userInfo: TelemetryUser) {
  const { email, internal } = userInfo;
  const isQAUser = email && QA_EMAIL_ADDRESSES.includes(email);
  const isInternal = internal;
  const shouldDisableMixpanel = isQAUser || isInternal;

  // This gives us an option to log telemetry events in development.
  const forceEnableMixpanel = prefs.logTelemetryEvent;

  if (!shouldDisableMixpanel || forceEnableMixpanel) {
    enableMixpanel();
    setMixpanelContext(userInfo);
  } else {
    disableMixpanel();
  }
}

export async function trackEvent(event: string, additionalContext?: Object) {
  if (mixpanelDisabled) {
    return;
  }

  const context = { ...additionalContext };

  if (prefs.logTelemetryEvent) {
    console.log("🔴", event, context);
  }

  mixpanel.track(event, context);
}

export function setMixpanelContext({ id, email }: TelemetryUser) {
  if (id) {
    mixpanel.identify(id);
  }

  if (email) {
    mixpanel.people.set({ $email: email });
  }

  if (prefs.logTelemetryEvent) {
    mixpanel.register({ isDevEvent: true });
  }
}

export const endMixpanelSession = () => trackEvent("session-end");
export const trackViewMode = (viewMode: ViewMode) =>
  trackEvent(viewMode == "dev" ? "visit devtools" : "visit viewer");

function setupSessionEndListener() {
  window.addEventListener("beforeunload", endMixpanelSession);
}
