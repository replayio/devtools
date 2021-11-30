import { PrefsHelper } from "devtools/client/shared/prefs";
const { asyncStoreHelper } = require("devtools/shared/async-store-helper");

import { pref } from "devtools-services";

// app prefs.
pref("devtools.split-console", false);
pref("devtools.selected-panel", "console");
pref("devtools.user", "{}");
pref("devtools.recording-id", "");
pref("devtools.event-listeners-breakpoints", true);
pref("devtools.toolbox-height", "50%");
pref("devtools.view-mode", "non-dev");
pref("devtools.dev-secondary-panel-height", "375px");
pref("devtools.sidePanelSize", "240px");
pref("devtools.maxHitsDisplayed", 500);
pref("devtools.maxHitsEditable", 200);
pref("devtools.libraryFilterTime", "all");
pref("devtools.libraryFilterAssociation", "all");
pref("devtools.logTelemetryEvent", false);
pref("devtools.showRedactions", false);
pref("devtools.disableLogRocket", false);

// app features
pref("devtools.features.auth0", true);
pref("devtools.features.columnBreakpoints", false);
pref("devtools.features.commentEmojis", false);
pref("devtools.features.commentMentions", false);
pref("devtools.features.comments", true);
pref("devtools.features.consoleHover", false);
pref("devtools.features.eventCount", true);
pref("devtools.features.launchBrowser", true);
pref("devtools.features.network", false);
pref("devtools.features.eventLink", false);
pref("devtools.features.reactDevtools", false);
pref("devtools.features.smoothPlayback", true);
pref("devtools.features.termsOfService", false);
pref("devtools.features.transcriptHover", false);
pref("devtools.features.trimming", false);
pref("devtools.features.users", true);
pref("devtools.features.videoComments", false);
pref("devtools.features.videoPlayback", false);
pref("devtools.features.widgetHover", false);

export const prefs = new PrefsHelper("devtools", {
  splitConsole: ["Bool", "split-console"],
  selectedPanel: ["String", "selected-panel"],
  user: ["Json", "user"],
  recordingId: ["Json", "recording-id"],
  eventListenersBreakpoints: ["Bool", "event-listeners-breakpoints"],
  toolboxHeight: ["String", "toolbox-height"],
  viewMode: ["String", "view-mode"],
  secondaryPanelHeight: ["String", "dev-secondary-panel-height"],
  maxHitsDisplayed: ["Int", "maxHitsDisplayed"],
  maxHitsEditable: ["Int", "maxHitsEditable"],
  libraryFilterTime: ["String", "libraryFilterTime"],
  libraryFilterAssociation: ["String", "libraryFilterAssociation"],
  logTelemetryEvent: ["Bool", "logTelemetryEvent"],
  showRedactions: ["Bool", "showRedactions"],
  disableLogRocket: ["Bool", "disableLogRocket"],
  sidePanelSize: ["String", "sidePanelSize"],
});

export const features = new PrefsHelper("devtools.features", {
  auth0: ["Bool", "auth0"],
  columnBreakpoints: ["Bool", "columnBreakpoints"],
  commentEmojis: ["Bool", "commentEmojis"],
  commentMentions: ["Bool", "commentMentions"],
  comments: ["Bool", "comments"],
  consoleHover: ["Bool", "consoleHover"],
  eventCount: ["Bool", "eventCount"],
  launchBrowser: ["Bool", "launchBrowser"],
  network: ["Bool", "network"],
  eventLink: ["Bool", "eventLink"],
  private: ["Bool", "private"],
  reactDevtools: ["Bool", "reactDevtools"],
  smoothPlayback: ["Bool", "smoothPlayback"],
  termsOfService: ["Bool", "termsOfService"],
  transcriptHover: ["Bool", "transcriptHover"],
  trimming: ["Bool", "trimming"],
  users: ["Bool", "users"],
  videoComments: ["Bool", "videoComments"],
  videoPlayback: ["Bool", "videoPlayback"],
  widgetHover: ["Bool", "widgetHover"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  eventListenerBreakpoints: ["event-listener-breakpoints", undefined],
  replaySessions: ["replay-sessions", {}],
  commandHistory: ["command-history", []],
});
