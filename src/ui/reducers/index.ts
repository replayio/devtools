import debuggerReducers from "devtools/client/debugger/src/reducers";
import * as debuggerSelectors from "devtools/client/debugger/src/selectors";
import * as inspectorReducers from "devtools/client/inspector/reducers";

import app, * as appSelectors from "./app";
import layout, * as layoutSelectors from "./layout";
import network, * as networkSelectors from "./network";
import protocolMessages from "./protocolMessages";
import { selectors as sourcesSelectors } from "./sources";
import timeline, * as timelineSelectors from "./timeline";

export const reducers = {
  app,
  timeline,
  network,
  protocolMessages: protocolMessages,
  layout,
  ...debuggerReducers,
  ...inspectorReducers,
};

export const selectors = {
  ...appSelectors,
  ...debuggerSelectors,
  ...layoutSelectors,
  ...networkSelectors,
  ...timelineSelectors,
  ...sourcesSelectors,
};
