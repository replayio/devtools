import { bindActionCreators, Store } from "redux";

import { sessionError, uploadedData } from "@recordreplay/protocol";
import { initSocket, addEventListener } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { setupGraphics } from "protocol/graphics";
import { setupLogpoints } from "protocol/logpoint";

import { extendStore } from "../store";
import app from "ui/reducers/app";
import timeline from "ui/reducers/timeline";
import comments from "ui/reducers/comments";
import contextMenus from "ui/reducers/contextMenus";
import reactDevTools from "ui/reducers/reactDevTools";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
const { setupApp, setupTimeline, setupReactDevTools } = actions;

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
import { initialMessageState } from "devtools/client/webconsole/reducers/messages";
import { assert } from "protocol/utils";
const { LocalizationHelper } = require("devtools/shared/l10n");
const { setupDemo } = require("ui/utils/demo");
import network from "ui/reducers/network";
import { setupNetwork } from "devtools/client/webconsole/actions/network";

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
    // We use 'command' in the backend and 'message' in the frontend so expose both :P
    console?: {
      prefs: typeof consolePrefs;
    };
    debugger?: any;
  }
  const gToolbox: DevToolsToolbox;
}

enum SessionError {
  UnexpectedClose = 1,
  BackendDeploy = 2,
  NodeTerminated = 3,
  KnownFatalError = 4,
  UnknownFatalError = 5,
  OldBuild = 6,
  LongRecording = 7,
}

// Reported reasons why a session can be destroyed.
const SessionErrorMessages: Record<number, string> = {
  [SessionError.BackendDeploy]: "Please wait a few minutes and try again.",
  [SessionError.NodeTerminated]: "Our servers hiccuped but things should be back to normal soon.",
  [SessionError.KnownFatalError]:
    "This error has been fixed in an updated version of Replay. Please try upgrading Replay and trying a new recording.",
  [SessionError.OldBuild]:
    "This error has been fixed in an updated version of Replay. Please try upgrading Replay and trying a new recording.",
  [SessionError.LongRecording]:
    "You’ve hit an error that happens with long recordings. Can you try a shorter recording?",
};

export default async function DevTools(store: Store) {
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
    comments,
    contextMenus,
    network,
    reactDevTools,
    timeline,
    ...debuggerReducers,
    ...consoleReducers.reducers,
  };

  const thunkArgs = {
    client: clientCommands,
    ...bootstrapWorkers(),
    prefsService: getPrefsService(),
  };

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

  addEventListener("Recording.sessionError", (error: sessionError) => {
    const content: string =
      SessionErrorMessages[error.code] ||
      "Something went wrong while replaying, we'll look into it as soon as possible.";

    store.dispatch(
      actions.setUnexpectedError({
        ...error,
        message: "Our apologies!",
        content,
        action: "refresh",
      })
    );
  });

  setupApp(store);
  setupTimeline(store);
  setupEventListeners(store);
  setupGraphics(store);
  initOutputSyntaxHighlighting();
  setupMessages(store);
  setupNetwork(store);
  setupLogpoints(store);
  setupExceptions(store);
  setupReactDevTools(store);

  setupDemo();
}

function bindSelectors(obj: any) {
  return Object.keys(obj.selectors).reduce((bound, selector) => {
    bound[selector] = (a: any, b: any, c: any) =>
      obj.selectors[selector](obj.store.getState(), a, b, c);
    return bound;
  }, {} as any);
}
