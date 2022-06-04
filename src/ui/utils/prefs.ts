import { PrefsHelper } from "devtools/client/shared/prefs";
import { pref } from "devtools/shared/services";
import debounce from "lodash/debounce";

const { asyncStoreHelper } = require("devtools/shared/async-store-helper");
const asyncStorage = require("devtools/shared/async-storage");

// app prefs.
pref("devtools.event-listeners-breakpoints", true);
pref("devtools.toolbox-size", "50%");
pref("devtools.view-mode", "non-dev");
pref("devtools.dev-secondary-panel-height", "375px");
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
pref("devtools.features.commentAttachments", false);
pref("devtools.features.networkRequestComments", true);
pref("devtools.features.turboReplay", false);
pref("devtools.features.breakpointPanelAutocomplete", true);
pref("devtools.features.codeHeatMaps", true);
pref("devtools.features.resolveRecording", false);
pref("devtools.features.protocolTimeline", false);
pref("devtools.features.logProtocol", false);
pref("devtools.features.unicornConsole", true);
pref("devtools.features.showRedux", true);
pref("devtools.features.enableLargeText", false);
pref("devtools.features.softFocus", false);
pref("devtools.features.repaintEvaluations", false);
pref("devtools.features.testSupport", false);

export const prefs = new PrefsHelper("devtools", {
  eventListenersBreakpoints: ["Bool", "event-listeners-breakpoints"],
  toolboxSize: ["String", "toolbox-size"],
  viewMode: ["String", "view-mode"],
  secondaryPanelHeight: ["String", "dev-secondary-panel-height"],
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
  turboReplay: ["Bool", "turboReplay"],
  columnBreakpoints: ["Bool", "columnBreakpoints"],
  httpBodies: ["Bool", "httpBodies"],
  commentAttachments: ["Bool", "commentAttachments"],
  networkRequestComments: ["Bool", "networkRequestComments"],
  breakpointPanelAutocomplete: ["Bool", "breakpointPanelAutocomplete"],
  codeHeatMaps: ["Bool", "codeHeatMaps"],
  resolveRecording: ["Bool", "resolveRecording"],
  protocolTimeline: ["Bool", "protocolTimeline"],
  logProtocol: ["Bool", "logProtocol"],
  unicornConsole: ["Bool", "unicornConsole"],
  showRedux: ["Bool", "showRedux"],
  enableLargeText: ["Bool", "enableLargeText"],
  softFocus: ["Bool", "softFocus"],
  repaintEvaluations: ["Bool", "repaintEvaluations"],
  testSupport: ["Bool", "testSupport"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  eventListenerBreakpoints: ["event-listener-breakpoints", undefined],
  replaySessions: ["replay-sessions", {}],
  commandHistory: ["command-history", []],
});

export const updateAsyncStore = debounce(value => asyncStorage.setItem("devtools", value), 1_000);
