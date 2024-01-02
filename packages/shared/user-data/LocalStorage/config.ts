export type ReplayNextCurrentPanel = "comments" | "protocol-viewer" | "search" | "sources";
export type ProtocolViewerSelectedTab = "live" | "recorded";
export type PlaywrightStepSelectedTab = "elements" | "source";

export const config = {
  elementsPanelAdvancedSearch: false,
  enableTestSuitesNewRunsView: false,
  enableTestSuitesTestsView: false,
  playwrightStepSelectedTab: "elements" as PlaywrightStepSelectedTab,
  protocolViewerSelectedTab: "live" as ProtocolViewerSelectedTab,
  reactDevToolsContextExpanded: Boolean(true),
  reactDevToolsHooksExpanded: Boolean(true),
  reactDevToolsPropsExpanded: Boolean(true),
  reactDevToolsRenderedByExpanded: Boolean(true),
  reactDevToolsStateExpanded: Boolean(true),
  replayNextCurrentPanel: "sources" as ReplayNextCurrentPanel,
  replayVideoPanelCollapsed: false,
};
