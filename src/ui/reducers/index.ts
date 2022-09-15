import app, * as appSelectors from "./app";
import timeline, * as timelineSelectors from "./timeline";
import network, * as networkSelectors from "./network";
import layout, * as layoutSelectors from "./layout";
import contextMenus from "./contextMenus";
import reactDevTools, * as reactDevToolsSelectors from "./reactDevTools";
import debuggerReducers from "devtools/client/debugger/src/reducers";
import * as debuggerSelectors from "devtools/client/debugger/src/selectors";
import * as inspectorReducers from "devtools/client/inspector/reducers";
import * as hitCountsSelectors from "./hitCounts";
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
  ...inspectorReducers,
};

export const selectors = {
  ...appSelectors,
  ...debuggerSelectors,
  ...hitCountsSelectors,
  ...layoutSelectors,
  ...possibleBreakpointsSelectors,
  ...networkSelectors,
  ...reactDevToolsSelectors,
  ...timelineSelectors,
  ...sourcesSelectors,
};
