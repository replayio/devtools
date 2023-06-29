import {
  ActiveInspectorTab,
  CommentsFilterByPreference,
  CommentsSortByPreference,
  ConfigurablePreferences,
  ConsoleEventFilterPreferences,
  Role,
} from "shared/preferences/types";
import { Theme } from "shared/theme/types";
import { ViewMode } from "ui/state/layout";

export const config = {
  activeInspectorTab: {
    defaultValue: "ruleview" as ActiveInspectorTab,
    legacyKey: "devtools.inspector.active-tab",
  },
  basicProcessingLoadingBar: {
    defaultValue: Boolean(false),
    description:
      "Split the loading bar's progress between gathering static resources from the recording and indexing runtime information",
    label: "Detailed loading bar",
    legacyKey: "devtools.features.basicProcessingLoadingBar",
  },
  boxModelOpen: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.layout.boxmodel.opened",
  },
  breakpointsVisible: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.breakpoints-visible",
  },
  brokenSourcemapWorkaround: {
    defaultValue: Boolean(true),
    description: "Skip locations that are mapped to the beginning of a function body",
    label: "Enable workaround for broken sourcemaps",
    legacyKey: "devtools.features.brokenSourcemapWorkaround",
  },
  callStackVisible: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.call-stack-visible",
  },
  collapseAttributes: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.markup.collapseAttributes",
  },
  collapseAttributeLength: {
    defaultValue: 120,
    legacyKey: "devtools.markup.collapseAttributeLength",
  },
  chromiumNetMonitor: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.features.chromiumNetMonitor",
  },
  chromiumRepaints: {
    defaultValue: Boolean(false),
    label: "Allow DOM.repaintGraphics inside of Chromium recordings",
    legacyKey: "devtools.features.chromiumRepaints",
  },
  columnBreakpoints: {
    defaultValue: Boolean(false),
    description: "Add breakpoints within a line",
    label: "Column Breakpoints",
    legacyKey: "devtools.features.columnBreakpoints",
  },
  commentAttachments: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.features.commentAttachments",
  },
  commentFilterBy: {
    defaultValue: null as CommentsFilterByPreference,
    legacyKey: "Replay:CommentPreferences:Filter",
  },
  commentShowPreview: {
    defaultValue: Boolean(true),
    legacyKey: "Replay:CommentPreferences:ShowPreview",
  },
  commentSortBy: {
    defaultValue: "recording-time" as CommentsSortByPreference,
    legacyKey: "Replay:CommentPreferences:sortBy",
  },
  consoleEventFilters: {
    defaultValue: {
      keyboard: true,
      mouse: true,
      navigation: true,
    } as ConsoleEventFilterPreferences,
    legacyKey: "Replay:EventsPreferences:Filters",
  },
  consoleFilterDrawerDefaultsToOpen: {
    defaultValue: Boolean(false),
    description:
      "Open the console filter settings by default when opening a Replay for the first time",
    internalOnly: Boolean(false),
    label: "Console filter drawer defaults to open",
    legacyKey: "devtools.features.consoleFilterDrawerDefaultsToOpen",
  },
  defaultColorUnit: {
    defaultValue: "authored",
    legacyKey: "devtools.defaultColorUnit",
  },
  defaultViewMode: {
    defaultValue: "non-dev" as ViewMode,
    label: "Default Mode",
    legacyKey: "devtools.defaultMode",
  },
  disableCache: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.disableCache",
  },
  disableConcurrentControllerLoading: {
    defaultValue: Boolean(false),
    description: "Disable loading regions concurrently at controller startup",
    internalOnly: Boolean(true),
    label: "Disable Concurrent Controller Loading",
    legacyKey: "devtools.features.disableConcurrentControllerLoading",
  },
  disableIncrementalSnapshots: {
    defaultValue: Boolean(false),
    description: "Disable using diffs between snapshots",
    label: "Disable using incremental snapshots",
    legacyKey: "devtools.features.disableIncrementalSnapshots",
  },
  disableLogRocket: {
    defaultValue: Boolean(false),
    label: "Disable LogRocket session replay",
    legacyKey: "devtools.disableLogRocket",
  },
  disableRecordingAssetsInDatabase: {
    defaultValue: Boolean(false),
    description:
      "Disable writing to and reading from the backend database when storing or retrieving recording assets",
    internalOnly: Boolean(true),
    label: "Disable tracking recording assets in the database",
    legacyKey: "devtools.features.disableRecordingAssetsInDatabase",
  },
  disableScanDataCache: {
    defaultValue: Boolean(false),
    description: "Do not cache the results of indexing the recording",
    internalOnly: Boolean(true),
    label: "Disable scan data cache",
    legacyKey: "devtools.features.disableScanDataCache",
  },
  disableStableQueryCache: {
    defaultValue: Boolean(false),
    description: "Disable caching of previously generated responses",
    internalOnly: Boolean(true),
    label: "Disable query-level caching for stable request types",
    legacyKey: "devtools.features.disableStableQueryCache",
  },
  enableLargeText: {
    defaultValue: Boolean(false),
    label: "Enable large text for Editor",
    legacyKey: "devtools.features.enableLargeText",
  },
  enableRoutines: {
    defaultValue: Boolean(false),
    description: "Enable backend support for running processing routines (like React DevTools)",
    label: "Enable backend processing routines",
    legacyKey: "devtools.features.enableRoutines",
  },
  enableUnstableQueryCache: {
    defaultValue: Boolean(false),
    description:
      "Allow the backend to return previously generated responses without re-running the request",
    internalOnly: Boolean(true),
    label: "Enable query-level caching for unstable request types",
    legacyKey: "devtools.features.enableUnstableQueryCache",
  },
  frameworkGroupingOn: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.ui.framework-grouping-on",
  },
  inactiveCssEnabled: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.inspector.inactive.css.enabled",
  },
  keepAllTraces: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.features.keepAllTraces",
  },
  listenForMetrics: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.listenForMetrics",
  },
  logpointsVisible: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.logpoints-visible",
  },
  logProtocol: {
    defaultValue: Boolean(false),
    label: "View protocol requests and responses in the panel",
    legacyKey: "devtools.features.logProtocol",
  },
  logProtocolEvents: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.features.logProtocolEvents",
  },
  logTelemetryEvent: {
    defaultValue: Boolean(false),
    label: "Log Mixpanel events to the console",
    legacyKey: "devtools.logTelemetryEvent",
  },
  newControllerOnRefresh: {
    defaultValue: Boolean(false),
    label: "Get a new controller upon each page refresh",
    legacyKey: "devtools.features.newControllerOnRefresh",
  },
  outlineExpanded: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.outline-expanded",
  },
  profileWorkerThreads: {
    defaultValue: Boolean(false),
    description:
      "Record a performance profile of the source worker and send it to Replay to help diagnose performance issues",
    internalOnly: Boolean(true),
    label: "Profile Source Worker",
    legacyKey: "devtools.features.profileWorkerThreads",
  },
  protocolTimeline: {
    defaultValue: Boolean(false),
    label: "Visualize protocol events in the timeline",
    legacyKey: "devtools.features.protocolTimeline",
  },
  reactPanel: {
    defaultValue: Boolean(false),
    description: "Enable experimental React render details panel",
    label: "Enable React Panel",
    legacyKey: "devtools.features.reactPanel",
  },
  repaintEvaluations: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.features.repaintEvaluations",
  },
  rerunRoutines: {
    defaultValue: Boolean(false),
    description: "Always re-run routines instead of using cached results",
    internalOnly: Boolean(true),
    label: "Retry backend processing routines",
    legacyKey: "devtools.features.rerunRoutines",
  },
  resolveRecording: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.features.resolveRecording",
  },
  role: {
    defaultValue: "other" as Role,
    legacyKey: null,
  },
  scopesVisible: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.scopes-visible",
  },
  showHitCounts: {
    defaultValue: Boolean(true),
    label: "Show hit count numbers for each source line",
    legacyKey: "Replay:ShowHitCounts",
  },
  showPassport: {
    defaultValue: Boolean(false),
    label: "Show Replay Passport",
    legacyKey: "devtools.features.showPassport",
  },
  showPseudoElements: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.inspector.show_pseudo_elements",
  },
  showRedactions: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.showRedactions",
  },
  sidePanelCollapsed: {
    defaultValue: Boolean(false),
    legacyKey: "Replay:SidePanelCollapsed",
  },
  sourcesCollapsed: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.debugger.sources-collapsed",
  },
  theme: {
    defaultValue: "system" as Theme,
    label: "Theme",
    legacyKey: "devtools.theme",
  },
} satisfies ConfigurablePreferences;

export const ENUMS = {
  defaultViewMode: [
    { label: "Viewer", value: "non-dev" },
    { label: "DevTools", value: "dev" },
  ],
  theme: [
    { label: "Dark", value: "dark" },
    { label: "Light", value: "light" },
    { label: "System", value: "system" },
  ],
};
