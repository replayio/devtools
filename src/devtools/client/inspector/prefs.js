import { PrefsHelper } from "devtools/client/shared/prefs";

import Services from "devtools/shared/services";

const { pref } = Services;

pref("devtools.inspector.is-three-pane-mode-enabled", false);
pref("devtools.inspector.sidebar-size", 700);
pref("devtools.inspector.split-sidebar-size", 350);
pref("devtools.inspector.active-tab", "ruleview");
pref("devtools.gridinspector.showGridAreas", false);
pref("devtools.gridinspector.showGridLineNumbers", false);
pref("devtools.gridinspector.showInfiniteLines", false);
pref("layout.css.backdrop-filter.enabled", false);
pref("devtools.gridinspector.maxHighlighters", 3);
pref("devtools.markup.collapseAttributes", true);
pref("devtools.markup.collapseAttributeLength", 120);
pref("devtools.inspector.showUserAgentStyles", false);
pref("devtools.layout.boxmodel.highlightProperty", false);
pref("devtools.layout.boxmodel.opened", true);
pref("dom.input_events.beforeinput.enabled", false);
pref("devtools.defaultColorUnit", "authored");
pref("devtools.inspector.show_pseudo_elements", false);

// features
pref("devtools.inspector.features.show-whitespace-nodes", false);

export const prefs = new PrefsHelper("devtools.inspector", {
  is3PaneModeEnabled: ["Bool", "is-three-pane-mode-enabled"],
  sidebarSize: ["Int", "sidebar-size"],
  splitSidebarSize: ["Int", "split-sidebar-size"],
  activeTab: ["String", "active-tab"],
});

export const features = new PrefsHelper("devtools.inspector.features", {
  showWhitespaceNodes: ["Bool", "show-whitespace-nodes"],
});
