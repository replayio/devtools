import mixpanel, { Dict } from "mixpanel-browser";
import { ViewMode } from "ui/state/app";
import { getRecordingId, skipTelemetry } from "./environment";
import { prefs } from "./prefs";
import { TelemetryUser } from "./telemetry";

const QA_EMAIL_ADDRESSES = ["mock@user.io"];

// Keep mixpanel disabled until we know we have the user's info
// to send along with events. This keeps events from tests from being
// sent to mixpanel.
let mixpanelDisabled = true;

const enableMixpanel = () => (mixpanelDisabled = false);
const disableMixpanel = () => (mixpanelDisabled = true);

export function initializeMixpanel() {
  mixpanel.init("ffaeda9ef8fb976a520ca3a65bba5014");

  // Add the recordingId to the event metadata so we have a cookie crumb
  // trail for following flows in LogRocket.
  mixpanel.register({ recordingId: getRecordingId() });
}

export function maybeSetMixpanelContext(userInfo: TelemetryUser) {
  const { email, internal } = userInfo;
  const isQAUser = email && QA_EMAIL_ADDRESSES.includes(email);
  const isInternal = internal;
  const shouldDisableMixpanel = isQAUser || isInternal || skipTelemetry();

  // This gives us an option to log telemetry events in development.
  const forceEnableMixpanel = prefs.logTelemetryEvent;

  if (!shouldDisableMixpanel || forceEnableMixpanel) {
    setMixpanelContext(userInfo);
    enableMixpanel();
    trackMixpanelEvent("session_start");
    setupSessionEndListener();
  } else {
    disableMixpanel();
  }
}

export async function trackMixpanelEvent(event: string, properties?: Dict) {
  if (prefs.logTelemetryEvent) {
    console.log("🔴", event, properties);
  }

  if (!mixpanelDisabled) {
    mixpanel.track(event, properties);
  }
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

export const endMixpanelSession = () => trackMixpanelEvent("session_end");
export const trackViewMode = (viewMode: ViewMode) =>
  trackMixpanelEvent(viewMode == "dev" ? "visit devtools" : "visit viewer");

export const startUploadWaitTracking = () => mixpanel.time_event("upload_recording");
export const endUploadWaitTracking = () => trackMixpanelEvent("upload_recording");

function setupSessionEndListener() {
  window.addEventListener("beforeunload", endMixpanelSession);
}
