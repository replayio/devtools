import { bindActionCreators, Store } from "redux";

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
import contextMenus from "ui/reducers/contextMenus";
import reactDevTools from "ui/reducers/reactDevTools";
import { selectors } from "ui/reducers";
import { actions, UIStore } from "ui/actions";
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
import { initialMessageState } from "devtools/client/webconsole/reducers/messages";
import { assert } from "protocol/utils";
const { LocalizationHelper } = require("devtools/shared/l10n");
const { setupDemo } = require("ui/utils/demo");
import { sendMessage } from "protocol/socket";
import { setupNetwork } from "devtools/client/webconsole/actions/network";
import network from "ui/reducers/network";

declare global {
  interface Window {
    gToolbox: DevToolsToolbox;
    L10N: any;
    hasAlreadyBootstrapped: boolean;
  }
  interface AppHelpers {
    threadFront?: typeof ThreadFront;
    actions?: any;
    selectors?: typeof selectors;
    sendMessage?: typeof sendMessage;
    console?: {
      prefs: typeof consolePrefs;
    };
    debugger?: any;
  }
  const gToolbox: DevToolsToolbox;
}

const bootstrap = (store: UIStore) => {};

export default async (store: Store) => {
  if (window.hasAlreadyBootstrapped) {
    return;
  } else {
    window.hasAlreadyBootstrapped = true;
  }

  const url = new URL(window.location.href);
  const dispatchUrl = url.searchParams.get("dispatch") || process.env.NEXT_PUBLIC_DISPATCH_URL;
  assert(dispatchUrl);

  window.gToolbox = new DevToolsToolbox();

  window.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");

  window.app = window.app || {};
  window.app.threadFront = ThreadFront;
  window.app.actions = bindActionCreators(actions, store.dispatch);
  window.app.selectors = bindSelectors({ store, selectors });
  window.app.console = { prefs: consolePrefs };
  window.app.debugger = setupDebuggerHelper();
  window.app.sendMessage = (cmd, args = {}) => sendMessage(cmd, args, window.sessionId);

  const initialDebuggerState = await dbgClient.loadInitialState();
  const initialConsoleState = getConsoleInitialState();

  const commandHistory = await asyncStore.commandHistory;
  const messages = initialMessageState({ commandHistory });

  const initialState = {
    messages,
    ...initialDebuggerState,
    ...initialConsoleState,
  };

  const reducers = {
    app,
    timeline,
    comments,
    contextMenus,
    network,
    reactDevTools,
    ...debuggerReducers,
    ...consoleReducers.reducers,
  };

  const thunkArgs = {
    client: clientCommands,
    ...bootstrapWorkers(),
    prefsService: getPrefsService(),
  };

  if (!window.loaded) {
    extendStore(store, initialState, reducers, thunkArgs);

    dbgClient.bootstrap(store);

    // Initialize the socket so we can communicate with the server
    initSocket(store, dispatchUrl);

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
          message: "Our apologies!",
          content: "Something went wrong while replaying, we'll look into it as soon as possible.",
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
    setupNetwork(store);
    setupExceptions(store);
    setupReactDevTools(store);
    window.loaded = true;
    console.log("maybe");
  }

  const settings = await getUserSettings();
  updateEnableRepaint(settings.enableRepaint);

  setupDemo();
};

function bindSelectors(obj: any) {
  return Object.keys(obj.selectors).reduce((bound, selector) => {
    bound[selector] = (a: any, b: any, c: any) =>
      obj.selectors[selector](obj.store.getState(), a, b, c);
    return bound;
  }, {} as any);
}
