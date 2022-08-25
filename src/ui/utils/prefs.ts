import { PrefsHelper } from "devtools/client/shared/prefs";
import { pref } from "devtools/shared/services";

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
pref("devtools.features.columnBreakpoints", false);
pref("devtools.features.commentAttachments", false);
pref("devtools.features.enableLargeText", false);
pref("devtools.features.disableNewComponentArchitecture", false);
pref("devtools.features.logProtocol", false);
pref("devtools.features.logProtocolEvents", false);
pref("devtools.features.originalClassNames", false);
pref("devtools.features.protocolTimeline", false);
pref("devtools.features.repaintEvaluations", false);
pref("devtools.features.resolveRecording", false);
pref("devtools.features.hitCounts", true);
pref("devtools.features.disableUnHitLines", false);
pref("devtools.features.profileWorkerThreads", false);

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
  columnBreakpoints: ["Bool", "columnBreakpoints"],
  commentAttachments: ["Bool", "commentAttachments"],
  disableUnHitLines: ["Bool", "disableUnHitLines"],
  enableLargeText: ["Bool", "enableLargeText"],
  disableNewComponentArchitecture: ["Bool", "disableNewComponentArchitecture"],
  hitCounts: ["Bool", "hitCounts"],
  logProtocol: ["Bool", "logProtocol"],
  logProtocolEvents: ["Bool", "logProtocolEvents"],
  originalClassNames: ["Bool", "originalClassNames"],
  protocolTimeline: ["Bool", "protocolTimeline"],
  repaintEvaluations: ["Bool", "repaintEvaluations"],
  resolveRecording: ["Bool", "resolveRecording"],
  profileWorkerThreads: ["Bool", "profileWorkerThreads"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  commandHistory: ["command-history", []],
  eventListenerBreakpoints: ["event-listener-breakpoints", undefined],
  replaySessions: ["replay-sessions", {}],
});
