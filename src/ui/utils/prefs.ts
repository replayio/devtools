import { PrefsHelper } from "devtools/client/shared/prefs";
import { asyncStoreHelper } from "devtools/shared/async-store-helper";
import { pref } from "devtools/shared/services";
import { ReplaySession } from "ui/setup/prefs";

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
pref("devtools.features.disableStableQueryCache", false);
pref("devtools.features.enableUnstableQueryCache", false);
pref("devtools.features.enableLargeText", false);
pref("devtools.features.hitCounts", true);
pref("devtools.features.logProtocol", true);
pref("devtools.features.logProtocolEvents", false);
pref("devtools.features.newControllerOnRefresh", false);
pref("devtools.features.originalClassNames", false);
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
pref("devtools.features.enableIncrementalSnapshots", false);
pref("devtools.features.replayAssist", false);

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
  disableStableQueryCache: ["Bool", "disableStableQueryCache"],
  disableUnHitLines: ["Bool", "disableUnHitLines"],
  enableLargeText: ["Bool", "enableLargeText"],
  enableRoutines: ["Bool", "enableRoutines"],
  enableUnstableQueryCache: ["Bool", "enableUnstableQueryCache"],
  logProtocol: ["Bool", "logProtocol"],
  logProtocolEvents: ["Bool", "logProtocolEvents"],
  newControllerOnRefresh: ["Bool", "newControllerOnRefresh"],
  originalClassNames: ["Bool", "originalClassNames"],
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
  enableIncrementalSnapshots: ["Bool", "enableIncrementalSnapshots"],
  replayAssist: ["Bool", "replayAssist"],
});

export type Features = typeof features;

export const asyncStore = asyncStoreHelper("devtools", {
  replaySessions: ["Json", "replay-sessions", {} as Record<string, ReplaySession>],
});
