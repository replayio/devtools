import app, * as appSelectors from "./app";
import timeline, * as timelineSelectors from "./timeline";
import metadata, * as metadataSelectors from "./metadata";
import eventListenerBreakpoints, * as eventListenerBreakpointsSelectors from "devtools/client/debugger/src/reducers/event-listeners";

export const reducers = {
  app,
  timeline,
  metadata,
  eventListenerBreakpoints,
};

export const selectors = {
  ...appSelectors,
  ...timelineSelectors,
  ...metadataSelectors,
  ...eventListenerBreakpointsSelectors,
};
