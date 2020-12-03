import { PrefsHelper } from "devtools/client/shared/prefs";
import { asyncStoreHelper } from "devtools-modules";

import Services from "devtools-services";

// Schema version to bump when the async store format has changed incompatibly
// and old stores should be cleared.
const { pref } = Services;

// app prefs.
pref("devtools.split-console", false);
pref("devtools.selected-panel", "console");
pref("devtools.user", "{}");
pref("devtools.recording-id", "");
pref("devtools.event-listeners-breakpoints", true);
pref("devtools.toolbox-height", "50%");
pref("devtools.non-dev-side-panel-width", "75%");
pref("devtools.view-mode", "non-dev");

// app features
pref("devtools.features.comments", true);
pref("devtools.features.users", true);
pref("devtools.features.auth0", true);

export const prefs = new PrefsHelper("devtools", {
  splitConsole: ["Bool", "split-console"],
  selectedPanel: ["String", "selected-panel"],
  user: ["Json", "user"],
  recordingId: ["Json", "recording-id"],
  eventListenersBreakpoints: ["Bool", "event-listeners-breakpoints"],
  toolboxHeight: ["String", "toolbox-height"],
  nonDevSidePanelWidth: ["String", "non-dev-side-panel-width"],
  viewMode: ["String", "view-mode"],
});

export const features = new PrefsHelper("devtools.features", {
  comments: ["Bool", "comments"],
  users: ["Bool", "users"],
  auth0: ["Bool", "auth0"],
  private: ["Bool", "private"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  eventListenerBreakpoints: ["event-listener-breakpoints", undefined],
});
