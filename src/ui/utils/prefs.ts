import { PrefsHelper } from "devtools/client/shared/prefs";
import { pref } from "devtools/shared/services";
import { isTest } from "./environment";

const { asyncStoreHelper } = require("devtools/shared/async-store-helper");

// app prefs.
pref("devtools.defaultMode", "non-dev");
pref("devtools.dev-secondary-panel-height", "375px");
pref("devtools.disableCache", false);
pref("devtools.disableLogRocket", false);
pref("devtools.event-listeners-breakpoints", true);
pref("devtools.listenForMetrics", false);
pref("devtools.logTelemetryEvent", false);
pref("devtools.showPanelAbove", false);
pref("devtools.showRedactions", false);
pref("devtools.sidePanelSize", "240px");
pref("devtools.theme", "system");
pref("devtools.toolbox-size", "50%");
pref("devtools.consoleFilterDrawerExpanded", true);
pref("devtools.hitCounts", "hide-counts");

// app features
pref("devtools.features.basicProcessingLoadingBar", false);
pref("devtools.features.columnBreakpoints", false);
pref("devtools.features.commentAttachments", false);
pref("devtools.features.consoleFilterDrawerDefaultsToOpen", false);
pref("devtools.features.disableUnHitLines", false);
pref("devtools.features.enableLargeText", false);
pref("devtools.features.newSourceViewer", false);
pref("devtools.features.enableQueryCache", false);
pref("devtools.features.hitCounts", true);
pref("devtools.features.logProtocol", false);
pref("devtools.features.logProtocolEvents", false);
pref("devtools.features.originalClassNames", false);
pref("devtools.features.profileWorkerThreads", false);
pref("devtools.features.protocolTimeline", false);
pref("devtools.features.repaintEvaluations", false);
pref("devtools.features.resolveRecording", false);
pref("devtools.features.chromiumNetMonitor", true);

export const prefs = new PrefsHelper("devtools", {
  colorScheme: ["String", "colorScheme"],
  defaultMode: ["String", "defaultMode"],
  disableCache: ["Bool", "disableCache"],
  disableLogRocket: ["Bool", "disableLogRocket"],
  eventListenersBreakpoints: ["Bool", "event-listeners-breakpoints"],
  listenForMetrics: ["Bool", "listenForMetrics"],
  logTelemetryEvent: ["Bool", "logTelemetryEvent"],
  secondaryPanelHeight: ["String", "dev-secondary-panel-height"],
  showPanelAbove: ["Bool", "showPanelAbove"],
  showRedactions: ["Bool", "showRedactions"],
  sidePanelSize: ["String", "sidePanelSize"],
  theme: ["String", "theme"],
  toolboxSize: ["String", "toolbox-size"],
  consoleFilterDrawerExpanded: ["Bool", "consoleFilterDrawerExpanded"],
  hitCounts: ["String", "hitCounts"],
});

export const features = new PrefsHelper("devtools.features", {
  basicProcessingLoadingBar: ["Bool", "basicProcessingLoadingBar"],
  columnBreakpoints: ["Bool", "columnBreakpoints"],
  commentAttachments: ["Bool", "commentAttachments"],
  consoleFilterDrawerDefaultsToOpen: ["Bool", "consoleFilterDrawerDefaultsToOpen"],
  enableQueryCache: ["Bool", "enableQueryCache"],
  newSourceViewer: ["Bool", "newSourceViewer"],
  disableUnHitLines: ["Bool", "disableUnHitLines"],
  enableLargeText: ["Bool", "enableLargeText"],
  hitCounts: ["Bool", "hitCounts"],
  logProtocol: ["Bool", "logProtocol"],
  logProtocolEvents: ["Bool", "logProtocolEvents"],
  originalClassNames: ["Bool", "originalClassNames"],
  profileWorkerThreads: ["Bool", "profileWorkerThreads"],
  protocolTimeline: ["Bool", "protocolTimeline"],
  repaintEvaluations: ["Bool", "repaintEvaluations"],
  resolveRecording: ["Bool", "resolveRecording"],
  chromiumNetMonitor: ["Bool", "chromiumNetMonitor"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  replaySessions: ["replay-sessions", {}],
});
