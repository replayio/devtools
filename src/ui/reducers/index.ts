import app, * as appSelectors from "./app";
import timeline, * as timelineSelectors from "./timeline";
import network, * as networkSelectors from "./network";
import layout, * as layoutSelectors from "./layout";
import contextMenus from "./contextMenus";
import reactDevTools, * as reactDevToolsSelectors from "./reactDevTools";
import * as eventListenerBreakpointsSelectors from "devtools/client/debugger/src/reducers/event-listeners";
import debuggerReducers from "devtools/client/debugger/src/reducers";
import consoleReducers from "devtools/client/webconsole/reducers";
import * as consoleSelectors from "devtools/client/webconsole/selectors";
import * as debuggerSelectors from "devtools/client/debugger/src/selectors";
import * as inspectorReducers from "devtools/client/inspector/reducers";
import { selectors as possibleBreakpointsSelectors } from "./possibleBreakpoints";
import { selectors as sourcesSelectors } from "./sources";
import protocolMessages from "./protocolMessages";

export const reducers = {
  app,
  timeline,
  contextMenus,
  network,
  protocolMessages: protocolMessages,
  reactDevTools,
  layout,
  ...debuggerReducers,
  ...consoleReducers.reducers,
  ...inspectorReducers,
};

export const selectors = {
  ...appSelectors,
  ...consoleSelectors,
  ...debuggerSelectors,
  ...eventListenerBreakpointsSelectors,
  ...layoutSelectors,
  ...possibleBreakpointsSelectors,
  ...networkSelectors,
  ...reactDevToolsSelectors,
  ...timelineSelectors,
  ...sourcesSelectors,
};
