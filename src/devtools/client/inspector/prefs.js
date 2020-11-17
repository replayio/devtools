import { PrefsHelper } from "devtools/client/shared/prefs";

import Services from "devtools-services";

const { pref } = Services;

pref("devtools.inspector.three-pane-enabled", false);

// features
pref("devtools.inspector.features.old-rulesview.enabled", false);
pref("devtools.inspector.features.show-whitespace-nodes", true);

export const prefs = new PrefsHelper("devtools.inspector", {
  threePaneEnabled: ["Bool", "three-pane-enabled"],
});

export const features = new PrefsHelper("devtools.inspector.features", {
  oldRulesView: ["Bool", "old-rulesview.enabled"],
  showWhitespaceNodes: ["Bool", "show-whitespace-nodes"],
});
