import { PrefsHelper } from "devtools/client/shared/prefs";
import { pref } from "devtools/shared/services";

// Note: additional preferences are defined in other files,
// including uses of `pref()`, `useLocalStorage`, and `useIndexedDB`.

// app prefs.
pref("devtools.defaultMode", "non-dev");
pref("devtools.disableCache", false);
pref("devtools.disableLogRocket", false);
pref("devtools.listenForMetrics", false);
pref("devtools.logTelemetryEvent", false);
pref("devtools.showRedactions", false);
pref("devtools.theme", "system");

// app features
pref("devtools.features.basicProcessingLoadingBar", false);
pref("devtools.features.columnBreakpoints", false);
pref("devtools.features.commentAttachments", false);
pref("devtools.features.consoleFilterDrawerDefaultsToOpen", false);
pref("devtools.features.disableScanDataCache", false);
pref("devtools.features.disableStableQueryCache", false);
pref("devtools.features.enableUnstableQueryCache", false);
pref("devtools.features.enableLargeText", false);
pref("devtools.features.logProtocol", false);
pref("devtools.features.logProtocolEvents", false);
pref("devtools.features.newControllerOnRefresh", false);
pref("devtools.features.profileWorkerThreads", false);
pref("devtools.features.enableRoutines", false);
pref("devtools.features.rerunRoutines", false);
pref("devtools.features.protocolTimeline", false);
pref("devtools.features.reactPanel", false);
pref("devtools.features.repaintEvaluations", false);
pref("devtools.features.resolveRecording", false);
pref("devtools.features.chromiumNetMonitor", true);
pref("devtools.features.chromiumRepaints", false);
pref("devtools.features.brokenSourcemapWorkaround", true);
pref("devtools.features.disableRecordingAssetsInDatabase", false);
pref("devtools.features.keepAllTraces", false);
pref("devtools.features.disableIncrementalSnapshots", false);
pref("devtools.features.disableConcurrentControllerLoading", false);
pref("devtools.features.showPassport", false);

export const prefs = new PrefsHelper("devtools", {
  colorScheme: ["String", "colorScheme"],
  defaultMode: ["String", "defaultMode"],
  disableCache: ["Bool", "disableCache"],
  disableLogRocket: ["Bool", "disableLogRocket"],
  listenForMetrics: ["Bool", "listenForMetrics"],
  logTelemetryEvent: ["Bool", "logTelemetryEvent"],
  showRedactions: ["Bool", "showRedactions"],
  theme: ["String", "theme"],
});

export const features = new PrefsHelper("devtools.features", {
  basicProcessingLoadingBar: ["Bool", "basicProcessingLoadingBar"],
  columnBreakpoints: ["Bool", "columnBreakpoints"],
  commentAttachments: ["Bool", "commentAttachments"],
  consoleFilterDrawerDefaultsToOpen: ["Bool", "consoleFilterDrawerDefaultsToOpen"],
  disableScanDataCache: ["Bool", "disableScanDataCache"],
  disableStableQueryCache: ["Bool", "disableStableQueryCache"],
  enableLargeText: ["Bool", "enableLargeText"],
  enableRoutines: ["Bool", "enableRoutines"],
  enableUnstableQueryCache: ["Bool", "enableUnstableQueryCache"],
  logProtocol: ["Bool", "logProtocol"],
  logProtocolEvents: ["Bool", "logProtocolEvents"],
  newControllerOnRefresh: ["Bool", "newControllerOnRefresh"],
  profileWorkerThreads: ["Bool", "profileWorkerThreads"],
  protocolTimeline: ["Bool", "protocolTimeline"],
  reactPanel: ["Bool", "reactPanel"],
  repaintEvaluations: ["Bool", "repaintEvaluations"],
  resolveRecording: ["Bool", "resolveRecording"],
  rerunRoutines: ["Bool", "rerunRoutines"],
  chromiumNetMonitor: ["Bool", "chromiumNetMonitor"],
  chromiumRepaints: ["Bool", "chromiumRepaints"],
  brokenSourcemapWorkaround: ["Bool", "brokenSourcemapWorkaround"],
  disableRecordingAssetsInDatabase: ["Bool", "disableRecordingAssetsInDatabase"],
  keepAllTraces: ["Bool", "keepAllTraces"],
  disableIncrementalSnapshots: ["Bool", "disableIncrementalSnapshots"],
  disableConcurrentControllerLoading: ["Bool", "disableConcurrentControllerLoading"],
  showPassport: ["Bool", "showPassport"],
});

export type Features = typeof features;
