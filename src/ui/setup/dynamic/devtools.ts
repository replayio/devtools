import { bindActionCreators } from "redux";

import { sessionError, uploadedData } from "@recordreplay/protocol";
import { initSocket, addEventListener } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { setupGraphics } from "protocol/graphics";
import { setupLogpoints } from "protocol/logpoint";
import { updateEnableRepaint } from "protocol/enable-repaint";

import { extendStore } from "../store";
import app from "ui/reducers/app";
import timeline from "ui/reducers/timeline";
import comments from "ui/reducers/comments";
import reactDevTools from "ui/reducers/reactDevTools";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
const { setupApp, setupTimeline, setupReactDevTools, createSession } = actions;

import * as dbgClient from "devtools/client/debugger/src/client";
import debuggerReducers from "devtools/client/debugger/src/reducers";
import { clientCommands } from "devtools/client/debugger/src/client/commands";
import { bootstrapWorkers } from "devtools/client/debugger/src/utils/bootstrap";
import { setupDebuggerHelper } from "devtools/client/debugger/src/utils/dbg";
import { setupEventListeners } from "devtools/client/debugger/src/actions/event-listeners";
const { setupExceptions } = require("devtools/client/debugger/src/actions/logExceptions");

import { getConsoleInitialState } from "devtools/client/webconsole/store";
import { prefs as consolePrefs } from "devtools/client/webconsole/utils/prefs";
import consoleReducers from "devtools/client/webconsole/reducers";
import { getPrefsService } from "devtools/client/webconsole/utils/prefs";
const { setupMessages } = require("devtools/client/webconsole/actions/messages");
const {
  initOutputSyntaxHighlighting,
} = require("devtools/client/webconsole/utils/syntax-highlighted");

import { DevToolsToolbox } from "ui/utils/devtools-toolbox";
import { asyncStore } from "ui/utils/prefs";
import { getUserSettings } from "ui/hooks/settings";
const { LocalizationHelper } = require("devtools/shared/l10n");
const { setupDemo } = require("ui/utils/demo");

declare global {
  interface Window {
    gToolbox: DevToolsToolbox;
    L10N: any;
  }
  interface AppHelpers {
    threadFront?: typeof ThreadFront;
    actions?: any;
    selectors?: typeof selectors;
    console?: {
      prefs: typeof consolePrefs;
    };
    debugger?: any;
  }
  const gToolbox: DevToolsToolbox;
}

const url = new URL(window.location.href);
const dispatch = url.searchParams.get("dispatch") || undefined;

(async () => {
  window.gToolbox = new DevToolsToolbox();

  window.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");

  window.app.threadFront = ThreadFront;
  window.app.actions = bindActionCreators(actions, store.dispatch);
  window.app.selectors = bindSelectors({ store, selectors });
  window.app.console = { prefs: consolePrefs };
  window.app.debugger = setupDebuggerHelper();

  const eventListenerBreakpoints = await asyncStore.eventListenerBreakpoints;
  if (eventListenerBreakpoints) {
    eventListenerBreakpoints.eventTypePoints ||= {};
  }
  const initialDebuggerState = await dbgClient.loadInitialState();
  const initialConsoleState = getConsoleInitialState();

  const initialState = {
    eventListenerBreakpoints,
    ...initialDebuggerState,
    ...initialConsoleState,
  };

  const reducers = {
    app,
    timeline,
    comments,
    reactDevTools,
    ...debuggerReducers,
    ...consoleReducers.reducers,
  };

  const thunkArgs = {
    client: clientCommands,
    ...bootstrapWorkers(),
    prefsService: getPrefsService(),
  };

  extendStore(initialState, reducers, thunkArgs);

  dbgClient.bootstrap(store);

  // Initialize the socket so we can communicate with the server
  initSocket(store, dispatch);

  addEventListener("Recording.uploadedData", (data: uploadedData) =>
    store.dispatch(actions.onUploadedData(data))
  );
  addEventListener("Recording.awaitingSourcemaps", () =>
    store.dispatch(actions.setAwaitingSourcemaps(true))
  );
  addEventListener("Recording.sessionError", (error: sessionError) =>
    store.dispatch(
      actions.setUnexpectedError({
        ...error,
        message: "Unexpected session error",
        content: "The session has closed due to an error. Please refresh the page.",
        action: "refresh",
      })
    )
  );

  setupApp(store);
  setupTimeline(store);
  setupEventListeners(store);
  setupGraphics(store);
  initOutputSyntaxHighlighting();
  setupMessages(store);
  setupLogpoints(store);
  setupExceptions(store);
  setupReactDevTools(store);

  const settings = await getUserSettings();
  updateEnableRepaint(settings.enableRepaint);

  setupDemo();
})();

function bindSelectors(obj: any) {
  return Object.keys(obj.selectors).reduce((bound, selector) => {
    bound[selector] = (a: any, b: any, c: any) =>
      obj.selectors[selector](obj.store.getState(), a, b, c);
    return bound;
  }, {} as any);
}
