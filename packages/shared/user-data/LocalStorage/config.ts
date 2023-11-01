export type ReplayNextCurrentPanel = "comments" | "protocol-viewer" | "search" | "sources";

export const config = {
  reactDevToolsContextExpanded: Boolean(true),
  reactDevToolsHooksExpanded: Boolean(true),
  reactDevToolsPropsExpanded: Boolean(true),
  reactDevToolsRenderedByExpanded: Boolean(true),
  reactDevToolsStateExpanded: Boolean(true),
  replayNextCurrentPanel: "sources" as ReplayNextCurrentPanel,
  replayVideoPanelCollapsed: false,
};
