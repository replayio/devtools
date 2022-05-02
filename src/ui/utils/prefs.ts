import { PrefsHelper } from "devtools/client/shared/prefs";
const { asyncStoreHelper } = require("devtools/shared/async-store-helper");

import { pref } from "devtools/shared/services";

// app prefs.
pref("devtools.event-listeners-breakpoints", true);
pref("devtools.toolbox-size", "50%");
pref("devtools.view-mode", "non-dev");
pref("devtools.dev-secondary-panel-height", "375px");
pref("devtools.maxHitsDisplayed", 500);
pref("devtools.maxHitsEditable", 200);
pref("devtools.logTelemetryEvent", false);
pref("devtools.showRedactions", false);
pref("devtools.disableLogRocket", false);
pref("devtools.listenForMetrics", false);
pref("devtools.disableCache", false);
pref("devtools.sidePanelSize", "240px");
pref("devtools.theme", "system");

// app features
pref("devtools.features.columnBreakpoints", false);
pref("devtools.features.httpBodies", true);
pref("devtools.features.videoPlayback", false);
pref("devtools.features.commentAttachments", false);
pref("devtools.features.networkRequestComments", true);
pref("devtools.features.tenMinuteReplays", false);
pref("devtools.features.breakpointPanelAutocomplete", true);
pref("devtools.features.codeHeatMaps", true);
pref("devtools.features.resolveRecording", false);
pref("devtools.features.advancedTimeline", false);
pref("devtools.features.unicornConsole", false);

export const prefs = new PrefsHelper("devtools", {
  eventListenersBreakpoints: ["Bool", "event-listeners-breakpoints"],
  toolboxSize: ["String", "toolbox-size"],
  viewMode: ["String", "view-mode"],
  secondaryPanelHeight: ["String", "dev-secondary-panel-height"],
  maxHitsDisplayed: ["Int", "maxHitsDisplayed"],
  maxHitsEditable: ["Int", "maxHitsEditable"],
  logTelemetryEvent: ["Bool", "logTelemetryEvent"],
  showRedactions: ["Bool", "showRedactions"],
  disableLogRocket: ["Bool", "disableLogRocket"],
  sidePanelSize: ["String", "sidePanelSize"],
  listenForMetrics: ["Bool", "listenForMetrics"],
  disableCache: ["Bool", "disableCache"],
  theme: ["String", "theme"],
  colorScheme: ["String", "colorScheme"],
});

export const features = new PrefsHelper("devtools.features", {
  tenMinuteReplays: ["Bool", "tenMinuteReplays"],
  columnBreakpoints: ["Bool", "columnBreakpoints"],
  httpBodies: ["Bool", "httpBodies"],
  videoPlayback: ["Bool", "videoPlayback"],
  commentAttachments: ["Bool", "commentAttachments"],
  networkRequestComments: ["Bool", "networkRequestComments"],
  breakpointPanelAutocomplete: ["Bool", "breakpointPanelAutocomplete"],
  codeHeatMaps: ["Bool", "codeHeatMaps"],
  resolveRecording: ["Bool", "resolveRecording"],
  advancedTimeline: ["Bool", "advancedTimeline"],
  unicornConsole: ["Bool", "unicornConsole"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  eventListenerBreakpoints: ["event-listener-breakpoints", undefined],
  replaySessions: ["replay-sessions", {}],
  commandHistory: ["command-history", []],
});
