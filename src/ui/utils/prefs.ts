import { PrefsHelper } from "devtools/client/shared/prefs";
const { asyncStoreHelper } = require("devtools/shared/async-store-helper");

import Services from "devtools-services";

// Schema version to bump when the async store format has changed incompatibly
// and old stores should be cleared.
const { pref } = Services;

// Get prefs from the URL with the format
// &prefs=<key>:<value>,<key>:<value> e.g. &prefs=video:true
function getUrlPrefs() {
  const url = new URL(window.location.href);
  const urlPrefs = url.searchParams.get("prefs") || "";
  return Object.fromEntries(urlPrefs.split(",").map(pref => pref.split(":")));
}

const urlPrefs = getUrlPrefs();

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
pref("devtools.features.comments", true);
pref("devtools.features.commentMentions", false);
pref("devtools.features.commentEmojis", false);
pref("devtools.features.users", true);
pref("devtools.features.auth0", true);
pref("devtools.features.videoComments", false);
pref("devtools.features.consoleHover", false);
pref("devtools.features.transcriptHover", false);
pref("devtools.features.widgetHover", false);
pref("devtools.features.reactDevtools", false);
pref("devtools.features.smoothPlayback", true);
pref("devtools.features.videoPlayback", false);
pref("devtools.features.launchBrowser", true);
pref("devtools.features.termsOfService", false);
pref("devtools.features.eventCount", true);
pref("devtools.features.columnBreakpoints", false);

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
  comments: ["Bool", "comments"],
  commentMentions: ["Bool", "commentMentions"],
  commentEmojis: ["Bool", "commentEmojis"],
  users: ["Bool", "users"],
  auth0: ["Bool", "auth0"],
  videoComments: ["Bool", "videoComments"],
  private: ["Bool", "private"],
  consoleHover: ["Bool", "consoleHover"],
  transcriptHover: ["Bool", "transcriptHover"],
  widgetHover: ["Bool", "widgetHover"],
  reactDevtools: ["Bool", "reactDevtools"],
  smoothPlayback: ["Bool", "smoothPlayback"],
  videoPlayback: ["Bool", "videoPlayback"],
  launchBrowser: ["Bool", "launchBrowser"],
  termsOfService: ["Bool", "termsOfService"],
  eventCount: ["Bool", "eventCount"],
  columnBreakpoints: ["Bool", "columnBreakpoints"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  eventListenerBreakpoints: ["event-listener-breakpoints", undefined],
  replaySessions: ["replay-sessions", {}],
});
