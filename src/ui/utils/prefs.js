import { PrefsHelper } from "devtools/client/shared/prefs";

import Services from "devtools-services";

// Schema version to bump when the async store format has changed incompatibly
// and old stores should be cleared.
const { pref } = Services;

// app prefs.
pref("devtools.split-console", true);
pref("devtools.selected-panel", "debugger");
pref("devtools.user", "{}");

// app features
pref("devtools.features.comments", true);
pref("devtools.features.users", false);

export const prefs = new PrefsHelper("devtools", {
  splitConsole: ["Bool", "split-console"],
  selectedPanel: ["String", "selected-panel"],
  user: ["Json", "user"],
});

export const features = new PrefsHelper("devtools.features", {
  comments: ["Bool", "comments"],
  comments: ["Bool", "users"],
});
