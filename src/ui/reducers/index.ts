import app, * as appSelectors from "./app";
import timeline, * as timelineSelectors from "./timeline";
import metadata, * as metadataSelectors from "./metadata";
import * as eventListenerBreakpointsSelectors from "devtools/client/debugger/src/reducers/event-listeners";
import debuggerReducers from "devtools/client/debugger/src/reducers";
import consoleReducers from "devtools/client/webconsole/reducers";
import * as consoleSelectors from "devtools/client/webconsole/selectors";
import * as debuggerSelectors from "devtools/client/debugger/src/selectors";
import * as inspectorReducers from "devtools/client/inspector/reducers";

export const reducers = {
  app,
  timeline,
  metadata,
  ...debuggerReducers,
  ...consoleReducers.reducers,
  ...inspectorReducers,
};

export const selectors = {
  ...appSelectors,
  ...timelineSelectors,
  ...metadataSelectors,
  ...eventListenerBreakpointsSelectors,
  ...consoleSelectors,
  ...debuggerSelectors,
};
