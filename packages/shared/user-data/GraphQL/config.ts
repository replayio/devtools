import { ConfigurablePreferences } from "shared/user-data/GraphQL/types";

export type ActiveInspectorTab = "ruleview" | "layoutview" | "computedview" | "eventsview";
export type CommentsFilterByPreference = "current-user" | null;
export type CommentsSortByPreference = "created-at" | "recording-time";
export type ConsoleEventFilterPreferences = {
  keyboard: boolean;
  mouse: boolean;
  navigation: boolean;
};
export type ConsoleEventFilterPreferencesKey = keyof ConsoleEventFilterPreferences;
export type Role = "developer" | "other";
export type Theme = "light" | "dark" | "system";
export type ViewMode = "dev" | "non-dev";

// The UserData service and the useGraphQLUserData() hook both use this configuration;
// Only values explicitly listed below can be managed by those services
//
// This configuration can be used to manage the following types of data:
// * Preferences: Things that are typically managed in a settings dialog
// * Features: New or experimental things that we want to give people a way to opt-in or opt-out from
// * History: Things we remember between sessions, e.g. the most recently selected tab
//
// To simplify TypeScript type-safety checks, all of the above are stored in the same, flat structure
// Prefixes and  alphabetical sorting are used to group similar types of data,
// and to reduce the likelihood of merge conflicts

export const config = {
  backend_disableCache: {
    defaultValue: Boolean(false),
    description: "Disable all caches, should only be used for debugging purposes",
    legacyKey: "devtools.disableCache",
    highRisk: Boolean(true),
    internalOnly: Boolean(true),
    label: "Disable all caches",
  },
  backend_disableConcurrentControllerLoading: {
    defaultValue: Boolean(false),
    description: "Disable loading regions concurrently at controller startup",
    internalOnly: Boolean(true),
    label: "Disable Concurrent Controller Loading",
    legacyKey: "devtools.features.disableConcurrentControllerLoading",
  },
  backend_enableRoutines: {
    defaultValue: Boolean(false),
    internalOnly: Boolean(true),
    description: "Enable backend support for running processing routines (like React DevTools)",
    label: "Enable backend processing routines",
    legacyKey: "devtools.features.enableRoutines",
  },
  backend_sampleAllTraces: {
    defaultValue: Boolean(false),
    internalOnly: Boolean(true),
    label: "Keep all Honeycomb events",
    legacyKey: "devtools.features.keepAllTraces",
    highRisk: Boolean(true),
  },
  backend_listenForMetrics: {
    defaultValue: Boolean(false),
    internalOnly: Boolean(true),
    legacyKey: "devtools.listenForMetrics",
  },
  backend_newControllerOnRefresh: {
    defaultValue: Boolean(false),
    highRisk: Boolean(true),
    label: "Get a new controller upon each page refresh",
    legacyKey: "devtools.features.newControllerOnRefresh",
  },
  backend_profileWorkerThreads: {
    defaultValue: Boolean(false),
    description:
      "Record a performance profile of the source worker and send it to Replay to help diagnose performance issues",
    internalOnly: Boolean(true),
    label: "Profile Source Worker",
    legacyKey: "devtools.features.profileWorkerThreads",
  },
  backend_rerunRoutines: {
    defaultValue: Boolean(false),
    description: "Always re-run routines instead of using cached results",
    highRisk: Boolean(true),
    internalOnly: Boolean(true),
    label: "Retry backend processing routines",
    legacyKey: "devtools.features.rerunRoutines",
  },

  comments_filterBy: {
    defaultValue: null as CommentsFilterByPreference,
    legacyKey: "Replay:CommentPreferences:Filter",
  },
  comments_showPreview: {
    defaultValue: Boolean(true),
    legacyKey: "Replay:CommentPreferences:ShowPreview",
  },
  comments_sortBy: {
    defaultValue: "recording-time" as CommentsSortByPreference,
    legacyKey: "Replay:CommentPreferences:sortBy",
  },

  console_eventFilters: {
    defaultValue: {
      keyboard: true,
      mouse: true,
      navigation: true,
    } as ConsoleEventFilterPreferences,
    legacyKey: "Replay:EventsPreferences:Filters",
  },
  console_showFiltersByDefault: {
    defaultValue: Boolean(false),
    internalOnly: Boolean(false),
    label: "Console filter drawer defaults to open",
    legacyKey: "devtools.features.consoleFilterDrawerDefaultsToOpen",
  },

  debugger_frameworkGroupingOn: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.ui.framework-grouping-on",
  },

  feature_chromiumNetMonitor: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.features.chromiumNetMonitor",
  },
  feature_commentAttachments: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.features.commentAttachments",
  },
  feature_protocolPanel: {
    defaultValue: Boolean(false),
    label: "View protocol requests and responses in the panel",
    legacyKey: "devtools.features.logProtocol",
  },
  feature_showPassport: {
    defaultValue: Boolean(false),
    label: "Show Replay Passport",
    legacyKey: "devtools.features.showPassport",
  },
  feature_protocolTimeline: {
    defaultValue: Boolean(false),
    label: "Visualize protocol events in the timeline",
    legacyKey: "devtools.features.protocolTimeline",
  },
  feature_showLogPointPanelAboveLine: {
    defaultValue: Boolean(false),
    label: "Show log point panel above source line",
    legacyKey: null,
  },

  global_disableLogRocket: {
    defaultValue: Boolean(false),
    label: "Disable LogRocket session replay",
    legacyKey: "devtools.disableLogRocket",
  },
  global_enableLargeText: {
    defaultValue: Boolean(false),
    label: "Enable large text for Editor",
    legacyKey: "devtools.features.enableLargeText",
  },
  global_logTelemetryEvent: {
    defaultValue: Boolean(false),
    label: "Log Mixpanel events to the console",
    legacyKey: "devtools.logTelemetryEvent",
  },
  global_role: {
    defaultValue: "other" as Role,
    legacyKey: null,
  },
  global_theme: {
    defaultValue: "system" as Theme,
    label: "Theme",
    legacyKey: "devtools.theme",
  },
  global_showRedactions: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.showRedactions",
  },

  inspector_activeTab: {
    defaultValue: "ruleview" as ActiveInspectorTab,
    legacyKey: "devtools.inspector.active-tab",
  },
  inspector_inactiveCssEnabled: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.inspector.inactive.css.enabled",
  },
  inspector_showPseudoElements: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.inspector.show_pseudo_elements",
  },

  layout_breakpointsPanelExpanded: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.breakpoints-visible",
  },
  layout_callStackPanelExpanded: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.call-stack-visible",
  },
  layout_defaultViewMode: {
    defaultValue: "non-dev" as ViewMode,
    label: "Default Mode",
    legacyKey: "devtools.defaultMode",
  },
  layout_debuggerOutlineExpanded: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.outline-expanded",
  },
  layout_inspectorBoxModelOpen: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.layout.boxmodel.opened",
  },
  layout_logpointsPanelExpanded: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.logpoints-visible",
  },
  layout_scopesPanelExpanded: {
    defaultValue: Boolean(true),
    legacyKey: "devtools.debugger.scopes-visible",
  },
  layout_sidePanelCollapsed: {
    defaultValue: Boolean(false),
    legacyKey: "Replay:SidePanelCollapsed",
  },
  layout_sourcesCollapsed: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.debugger.sources-collapsed",
  },
  layout_testsuitesPassportFirstRun: {
    defaultValue: Boolean(true),
    legacyKey: null,
  },
  protocol_repaintEvaluations: {
    defaultValue: Boolean(false),
    legacyKey: "devtools.features.repaintEvaluations",
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
