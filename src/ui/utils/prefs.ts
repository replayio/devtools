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
pref("devtools.sidePanelSize", "240px");

// app features
pref("devtools.features.columnBreakpoints", false);
pref("devtools.features.comments", true);
pref("devtools.features.darkMode", false);
pref("devtools.features.eventCount", true);
pref("devtools.features.httpBodies", true);
pref("devtools.features.launchBrowser", true);
pref("devtools.features.smoothPlayback", true);
pref("devtools.features.videoPlayback", false);
pref("devtools.features.commentAttachments", false);

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
});

export const features = new PrefsHelper("devtools.features", {
  columnBreakpoints: ["Bool", "columnBreakpoints"],
  comments: ["Bool", "comments"],
  darkMode: ["Bool", "darkMode"],
  eventCount: ["Bool", "eventCount"],
  httpBodies: ["Bool", "httpBodies"],
  launchBrowser: ["Bool", "launchBrowser"],
  smoothPlayback: ["Bool", "smoothPlayback"],
  videoPlayback: ["Bool", "videoPlayback"],
  commentAttachments: ["Bool", "commentAttachments"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  eventListenerBreakpoints: ["event-listener-breakpoints", undefined],
  replaySessions: ["replay-sessions", {}],
  commandHistory: ["command-history", []],
});
