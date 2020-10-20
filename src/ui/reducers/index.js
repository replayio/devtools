import app, * as appSelectors from "./app";
import timeline, * as timelineSelectors from "./timeline";
import metadata, * as metadataSelectors from "./metadata";
import * as eventListenerBreakpointsSelectors from "devtools/client/debugger/src/reducers/event-listeners";
import debuggerReducers from "devtools/client/debugger/src/reducers"


export const reducers = {
  app,
  timeline,
  metadata,
  ...debuggerReducers
};

export const selectors = {
  ...appSelectors,
  ...timelineSelectors,
  ...metadataSelectors,
  ...eventListenerBreakpointsSelectors,
};
