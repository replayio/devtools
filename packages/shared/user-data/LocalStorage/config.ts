export type ReplayNextCurrentPanel = "comments" | "protocol-viewer" | "search" | "sources";
export type ProtocolViewerSelectedTab = "live" | "recorded";

export const config = {
  elementsPanelAdvancedSearch: false,
  protocolViewerSelectedTab: "live" as ProtocolViewerSelectedTab,
  reactDevToolsContextExpanded: Boolean(true),
  reactDevToolsHooksExpanded: Boolean(true),
  reactDevToolsPropsExpanded: Boolean(true),
  reactDevToolsRenderedByExpanded: Boolean(true),
  reactDevToolsStateExpanded: Boolean(true),
  replayNextCurrentPanel: "sources" as ReplayNextCurrentPanel,
  replayVideoPanelCollapsed: false,
  enableTestSuitesNewRunsView: true,
  enableTestSuitesTestsView: true,
};
