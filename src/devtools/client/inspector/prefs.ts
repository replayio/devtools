import { PrefsHelper } from "devtools/client/shared/prefs";
import Services, { pref } from "devtools/shared/services";

pref("devtools.inspector.active-tab", "ruleview");
pref("devtools.markup.collapseAttributes", true);
pref("devtools.markup.collapseAttributeLength", 120);
pref("devtools.layout.boxmodel.opened", true);
pref("devtools.defaultColorUnit", "authored");
pref("devtools.inspector.show_pseudo_elements", false);

export const prefs = new PrefsHelper("devtools.inspector", {
  sidebarSize: ["Int", "sidebar-size"],
  splitSidebarSize: ["Int", "split-sidebar-size"],
  activeTab: ["String", "active-tab"],
});
