import { PrefsHelper } from "devtools/client/shared/prefs";

import Services from "devtools-services";

// Schema version to bump when the async store format has changed incompatibly
// and old stores should be cleared.
const { pref } = Services;

// app prefs.
pref("viewer.split-console", true);
pref("viewer.selected-panel", "debugger");

// app features
pref("viewer.features.comments", true);

export const prefs = new PrefsHelper("viewer", {
  splitConsole: ["Bool", "split-console"],
  selectedPanel: ["String", "selected-panel"],
});

export const features = new PrefsHelper("viewer", {
  comments: ["Bool", "features.comments"],
});
