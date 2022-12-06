import { PrefsHelper } from "devtools/client/shared/prefs";
import { asyncStoreHelper } from "devtools/shared/async-store-helper";
import { pref } from "devtools/shared/services";

// Note: additional preferences are defined in other files,
// including uses of `pref()`, `useLocalStorage`, and `useIndexedDB`.

// app prefs.
pref("devtools.defaultMode", "non-dev");
pref("devtools.dev-secondary-panel-height", "375px");
pref("devtools.disableCache", false);
pref("devtools.disableLogRocket", false);
pref("devtools.event-listeners-breakpoints", true);
pref("devtools.listenForMetrics", false);
pref("devtools.logTelemetryEvent", false);
pref("devtools.showRedactions", false);
pref("devtools.sidePanelSize", "240px");
pref("devtools.theme", "system");
pref("devtools.toolbox-size", "50%");
pref("devtools.consoleFilterDrawerExpanded", true);

// app features
pref("devtools.features.basicProcessingLoadingBar", false);
pref("devtools.features.columnBreakpoints", false);
pref("devtools.features.commentAttachments", false);
pref("devtools.features.consoleFilterDrawerDefaultsToOpen", false);
pref("devtools.features.disableScanDataCache", false);
pref("devtools.features.disableUnHitLines", false);
pref("devtools.features.enableLargeText", false);
pref("devtools.features.enableQueryCache", false);
pref("devtools.features.hitCounts", true);
pref("devtools.features.logProtocol", false);
pref("devtools.features.logProtocolEvents", false);
pref("devtools.features.newControllerOnRefresh", false);
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
  listenForMetrics: ["Bool", "listenForMetrics"],
  logTelemetryEvent: ["Bool", "logTelemetryEvent"],
  secondaryPanelHeight: ["String", "dev-secondary-panel-height"],
  showRedactions: ["Bool", "showRedactions"],
  sidePanelSize: ["String", "sidePanelSize"],
  theme: ["String", "theme"],
  toolboxSize: ["String", "toolbox-size"],
  consoleFilterDrawerExpanded: ["Bool", "consoleFilterDrawerExpanded"],
});

export const features = new PrefsHelper("devtools.features", {
  basicProcessingLoadingBar: ["Bool", "basicProcessingLoadingBar"],
  columnBreakpoints: ["Bool", "columnBreakpoints"],
  commentAttachments: ["Bool", "commentAttachments"],
  consoleFilterDrawerDefaultsToOpen: ["Bool", "consoleFilterDrawerDefaultsToOpen"],
  disableScanDataCache: ["Bool", "disableScanDataCache"],
  enableQueryCache: ["Bool", "enableQueryCache"],
  disableUnHitLines: ["Bool", "disableUnHitLines"],
  enableLargeText: ["Bool", "enableLargeText"],
  logProtocol: ["Bool", "logProtocol"],
  logProtocolEvents: ["Bool", "logProtocolEvents"],
  newControllerOnRefresh: ["Bool", "newControllerOnRefresh"],
  originalClassNames: ["Bool", "originalClassNames"],
  profileWorkerThreads: ["Bool", "profileWorkerThreads"],
  protocolTimeline: ["Bool", "protocolTimeline"],
  repaintEvaluations: ["Bool", "repaintEvaluations"],
  resolveRecording: ["Bool", "resolveRecording"],
  chromiumNetMonitor: ["Bool", "chromiumNetMonitor"],
});

export const asyncStore = asyncStoreHelper("devtools", {
  replaySessions: ["Json", "replay-sessions"],
});
