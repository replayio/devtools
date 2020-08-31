import { PrefsHelper } from "devtools/client/shared/prefs";
import { asyncStoreHelper } from "devtools-modules";

import Services from "devtools-services";

const { pref } = Services;

pref("devtools.inspector.three-pane-enabled", false);

// features
pref("devtools.inspector.features.new-rulesview.enabled", false);

export const prefs = new PrefsHelper("devtools.inspector", {
  threePaneEnabled: ["Bool", "three-pane-enabled"],
});

export const features = new PrefsHelper("devtools.inspector.features", {
  newRulesView: ["Bool", "new-rulesview.enabled"],
});
