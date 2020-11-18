import { PrefsHelper } from "devtools/client/shared/prefs";

import Services from "devtools-services";

const { pref } = Services;

pref("devtools.inspector.is-three-pane-mode-enabled", true);
pref("devtools.inspector.sidebar-size", 700);
pref("devtools.inspector.split-sidebar-size", 350);
pref("devtools.inspector.active-tab", "layoutview");

// features
pref("devtools.inspector.features.old-rulesview.enabled", false);
pref("devtools.inspector.features.show-whitespace-nodes", true);

export const prefs = new PrefsHelper("devtools.inspector", {
  is3PaneModeEnabled: ["Bool", "is-three-pane-mode-enabled"],
  sidebarSize: ["Int", "sidebar-size"],
  splitSidebarSize: ["Int", "split-sidebar-size"],
  activeTab: ["String", "active-tab"],
});

export const features = new PrefsHelper("devtools.inspector.features", {
  oldRulesView: ["Bool", "old-rulesview.enabled"],
  showWhitespaceNodes: ["Bool", "show-whitespace-nodes"],
});
