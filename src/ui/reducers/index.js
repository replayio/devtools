import app, * as appSelectors from "./app";
import timeline, * as timelineSelectors from "./timeline";
import metadata, * as metadataSelectors from "./metadata";
import eventListenerBreakpoints, * as eventListenerBreakpointsSelectors from "devtools/client/debugger/src/reducers/event-listeners";
import * as debuggerReducers from "devtools/client/debugger/reducers";
import * as debuggerSelectors from "devtools/client/debugger/selectors";

export const reducers = {
  app,
  timeline,
  metadata,
  eventListenerBreakpoints,
  ...debuggerReducers,
};

export const selectors = {
  ...appSelectors,
  ...timelineSelectors,
  ...metadataSelectors,
  ...eventListenerBreakpointsSelectors,
  ...debuggerSelectors,
};
