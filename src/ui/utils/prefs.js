import { PrefsHelper } from "devtools/client/shared/prefs";
import { asyncStoreHelper } from "devtools-modules";

import Services from "devtools-services";

// Schema version to bump when the async store format has changed incompatibly
// and old stores should be cleared.
const { pref } = Services;

// app prefs.
pref("devtools.split-console", true);
pref("devtools.selected-panel", "debugger");
pref("devtools.user", "{}");
pref("devtools.recording-id", "");
pref("devtools.event-listeners-breakpoints", true);
// Whether or not the developer tools toolbox is opened by default.
pref("devtools.toolbox-opened", true);

// app features
pref("devtools.features.comments", true);
pref("devtools.features.users", true);
pref("devtools.features.auth0", true);

export const prefs = new PrefsHelper("devtools", {
  isToolboxOpen: ["Bool", "toolbox-opened"],
  splitConsole: ["Bool", "split-console"],
  selectedPanel: ["String", "selected-panel"],
  user: ["Json", "user"],
  recordingId: ["Json", "recording-id"],
  eventListenersBreakpoints: ["Bool", "event-listeners-breakpoints"],
});

export const features = new PrefsHelper("devtools.features", {
  comments: ["Bool", "comments"],
  users: ["Bool", "users"],
  auth0: ["Bool", "auth0"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  eventListenerBreakpoints: ["event-listener-breakpoints", undefined],
});
