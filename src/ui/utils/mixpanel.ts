import { SessionId } from "@recordreplay/protocol";
import mixpanel, { Dict } from "mixpanel-browser";
import { getRecordingId } from "./recording";
import { ViewMode } from "ui/state/layout";
import { isReplayBrowser, skipTelemetry } from "./environment";
import { prefs } from "./prefs";
import { TelemetryUser, trackTiming } from "./telemetry";
import { UIState } from "ui/state";
import { getPaneCollapse } from "devtools/client/debugger/src/selectors";
import { getSelectedPanel } from "ui/reducers/app";
import { getSelectedPrimaryPanel, getViewMode } from "ui/reducers/layout";

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

const kickOffMixpanelTimer = () => {
  if (!window.app) {
    return;
  }
  const state = window.app.store.getState();
  mixpanel.track("time_spent", {
    selectedPrimaryPanel: getSelectedPrimaryPanel(state),
    selectedSecondaryPanel: getSelectedPanel(state),
    startPanelCollapsed: getPaneCollapse(state),
    viewMode: getViewMode(state),
  });

  setTimeout(() => {
    kickOffMixpanelTimer();
  }, 15000);
};

export function maybeSetMixpanelContext(userInfo: TelemetryUser & { workspaceId: string | null }) {
  const { email, internal } = userInfo;
  const isQAUser = email && QA_EMAIL_ADDRESSES.includes(email);
  const isInternal = internal;
  const shouldDisableMixpanel = isQAUser || isInternal || skipTelemetry();

  // This gives us an option to log telemetry events in development.
  const forceEnableMixpanel = prefs.logTelemetryEvent;

  if (!shouldDisableMixpanel || forceEnableMixpanel) {
    setMixpanelContext(userInfo);
    enableMixpanel();
    trackMixpanelEvent("session_start", { workspaceId: userInfo.workspaceId });
    kickOffMixpanelTimer();
    setupSessionEndListener();
  } else {
    disableMixpanel();
  }
}

export const maybeTrackTeamChange = (newWorkspaceId: string | null) => {
  if (!mixpanelDisabled) {
    mixpanel.people.set({ workspaceId: newWorkspaceId });
    trackMixpanelEvent("team_change", { workspaceId: newWorkspaceId });
  }
};

export async function trackMixpanelEvent(event: string, properties?: Dict) {
  if (prefs.logTelemetryEvent) {
    console.log("🔴", event, properties);
  }

  if (!mixpanelDisabled) {
    mixpanel.track(event, properties);
  }
}

const eventsBeingOnlyTrackedOnce = new Set();

export async function trackEventOnce(event: string, properties?: Dict) {
  if (eventsBeingOnlyTrackedOnce.has(event)) {
    return;
  }

  eventsBeingOnlyTrackedOnce.add(event);
  trackMixpanelEvent(event, properties);
}

export function setMixpanelContext({
  id,
  email,
  workspaceId,
}: TelemetryUser & { workspaceId: string | null }) {
  mixpanel.register({ isReplayBrowser: isReplayBrowser() });

  if (id) {
    mixpanel.identify(id);
  }

  if (email) {
    mixpanel.people.set({ $email: email });
  }

  if (workspaceId) {
    mixpanel.people.set({ workspaceId });
  }

  if (prefs.logTelemetryEvent) {
    mixpanel.register({ isDevEvent: true });
  }
}

export const endMixpanelSession = (reason: string) => () =>
  trackMixpanelEvent("session_end", { reason });
export const trackViewMode = (viewMode: ViewMode) =>
  trackMixpanelEvent(viewMode == "dev" ? "visit devtools" : "visit viewer");

export const startUploadWaitTracking = () => {
  // This one gets tracked in Honeycomb.
  trackTiming("kpi-time-to-view-replay");
  mixpanel.time_event("upload_recording");
};
export const endUploadWaitTracking = (sessionId: SessionId) => {
  // This one gets tracked in Honeycomb.
  trackTiming("kpi-time-to-view-replay", { sessionId });
  trackMixpanelEvent("upload_recording", { sessionId });
};

function setupSessionEndListener() {
  window.addEventListener("beforeunload", endMixpanelSession("unloaded"));
}
