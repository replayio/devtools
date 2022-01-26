import { SessionId } from "@recordreplay/protocol";
import mixpanel, { Dict } from "mixpanel-browser";
import { getRecordingId } from "./recording";
import { ViewMode } from "ui/state/layout";
import { isReplayBrowser, skipTelemetry } from "./environment";
import { prefs } from "./prefs";
import { TelemetryUser, trackTiming } from "./telemetry";
import { CanonicalRequestType } from "ui/components/NetworkMonitor/utils";
import { PrimaryPanelName, SecondaryPanelName, WorkspaceId } from "ui/state/app";

type MixpanelEvent =
  | ["breakpoint.add_comment"]
  | ["breakpoint.minus_click"]
  | ["breakpoint.plus_click"]
  | ["breakpoint.preview_has_hits"]
  | ["breakpoint.preview_no_hits"]
  | ["breakpoint.remove"]
  | ["breakpoint.set_condition"]
  | ["breakpoint.set_log"]
  | ["breakpoint.too_many_points"]
  | ["comments.create"]
  | ["comments.delete"]
  | ["comments.focus"]
  | ["comments.select_location"]
  | ["comments.start_edit"]
  | ["console.clear_messages"]
  | ["console.overflow"]
  | ["events_timeline.select"]
  | ["events_timeline.select_source"]
  | ["error.unauthenticated_viewer"]
  | ["error.unauthorized_viewer"]
  | ["header.open_share"]
  | ["header.edit_title"]
  | ["gutter.add_comment"]
  | ["key_shortcut.full_text_search"]
  | ["key_shortcut.show_command_palette"]
  | ["key_shortcut.toggle_left_sidebar"]
  | ["layout.default_devtools"]
  | ["layout.default_viewer"]
  | ["layout.devtools"]
  | ["layout.viewer"]
  | ["launch.download_replay", { OS: "mac" | "linux" | "windows" }]
  | ["login.first_log_in"]
  | ["net_monitor.add_type", { type: CanonicalRequestType }]
  | ["net_monitor.delete_type", { type: CanonicalRequestType }]
  | ["net_monitor.open_network_monitor"]
  | ["net_monitor.seek_to_request"]
  | ["net_monitor.select_request_row"]
  | ["object_inspector.label_click"]
  | ["onboarding.created_team"]
  | ["onboarding.demo_replay_launch"]
  | ["onboarding.demo_replay_prompt"]
  | ["onboarding.download_replay", { OS: "mac" | "linux" | "windows" }]
  | ["onboarding.download_replay_prompt"]
  | ["onboarding.finished_onboarding"]
  | ["onboarding.invited_team_member"]
  | ["onboarding.launch_replay"]
  | ["onboarding.skipped_create_team", { skippedFrom: string }]
  | ["onboarding.skipped_replay_download"]
  | ["onboarding.started_onboarding"]
  | ["onboarding.team_invite"]
  | ["quick_open.open_quick_open"]
  | ["session.devtools_start", { userIsAuthor: boolean }]
  | ["session_end", { reason: string }]
  | ["session_start", { workspaceId: WorkspaceId | null }]
  | ["share_modal.copy_link"]
  | ["share_modal.set_private"]
  | ["share_modal.set_public"]
  | ["share_modal.set_team"]
  | ["team_change", { workspaceId: WorkspaceId | null }]
  | ["timeline.comment_select"]
  | ["timeline.marker_select"]
  | ["timeline.pause"]
  | ["timeline.play"]
  | ["timeline.progress_select"]
  | ["timeline.replay"]
  | [`toolbox.primary.${PrimaryPanelName}_select`]
  | [`toolbox.secondary.${SecondaryPanelName}_select`]
  | ["toolbox.secondary.editor_toggle"]
  | ["toolbox.secondary.video_toggle"]
  | ["toolbox.toggle_sidebar"]
  | ["upload.complete", { sessionId: SessionId }]
  | ["upload.create_replay", { isDemo: boolean }]
  | ["upload.discard", { isDemo: boolean }]
  | ["user_options.launch_replay"]
  | ["user_options.select_docs"]
  | ["user_options.select_settings"];

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
    setupSessionEndListener();
  } else {
    disableMixpanel();
  }
}

export const maybeTrackTeamChange = (newWorkspaceId: WorkspaceId | null) => {
  if (!mixpanelDisabled) {
    mixpanel.people.set({ workspaceId: newWorkspaceId });
    trackMixpanelEvent("team_change", { workspaceId: newWorkspaceId });
  }
};

const NULL_NAMESPACE = "no_namespace";
const namespaceFromEventName = (event: string): string => {
  const namespace = event.slice(0, event.indexOf("."));
  return namespace.length ? namespace : NULL_NAMESPACE;
};

export async function trackMixpanelEvent(...[event, properties]: [...MixpanelEvent]) {
  if (prefs.logTelemetryEvent) {
    console.log("🔴", event, properties);
  }

  if (!mixpanelDisabled) {
    mixpanel.track(event, { ...properties, namespace: namespaceFromEventName(event) });
  }
}

const eventsBeingOnlyTrackedOnce = new Set();

export async function trackEventOnce(...[event, properties]: [...MixpanelEvent]) {
  if (eventsBeingOnlyTrackedOnce.has(event)) {
    return;
  }

  eventsBeingOnlyTrackedOnce.add(event);
  // @ts-ignore
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
  trackMixpanelEvent(viewMode == "dev" ? "layout.devtools" : "layout.viewer");

export const startUploadWaitTracking = () => {
  // This one gets tracked in Honeycomb.
  trackTiming("kpi-time-to-view-replay");
  mixpanel.time_event("upload.complete");
};
export const endUploadWaitTracking = (sessionId: SessionId) => {
  // This one gets tracked in Honeycomb.
  trackTiming("kpi-time-to-view-replay", { sessionId });
  trackMixpanelEvent("upload.complete", { sessionId });
};

function setupSessionEndListener() {
  window.addEventListener("beforeunload", endMixpanelSession("unloaded"));
}
