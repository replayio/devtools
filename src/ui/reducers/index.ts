import debuggerReducers from "devtools/client/debugger/src/reducers";
import * as debuggerSelectors from "devtools/client/debugger/src/selectors";
import * as inspectorReducers from "devtools/client/inspector/reducers";

import app, * as appSelectors from "./app";
import contextMenus from "./contextMenus";
import layout, * as layoutSelectors from "./layout";
import network, * as networkSelectors from "./network";
import protocolMessages from "./protocolMessages";
import reactDevTools, * as reactDevToolsSelectors from "./reactDevTools";
import { selectors as sourcesSelectors } from "./sources";
import timeline, * as timelineSelectors from "./timeline";

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
  ...layoutSelectors,
  ...networkSelectors,
  ...reactDevToolsSelectors,
  ...timelineSelectors,
  ...sourcesSelectors,
};
