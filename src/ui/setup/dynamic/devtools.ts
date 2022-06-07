import { MouseEvent, sessionError, TimeStampedPoint, uploadedData } from "@replayio/protocol";
// Side-effectful import, has to be imported before event-listeners
// Ordering matters here
import "devtools/client/inspector/prefs";
import { setupEventListeners } from "devtools/client/debugger/src/actions/event-listeners";
import { setupExceptions } from "devtools/client/debugger/src/actions/logExceptions";
import * as dbgClient from "devtools/client/debugger/src/client";
import { clientCommands } from "devtools/client/debugger/src/client/commands";
import debuggerReducers from "devtools/client/debugger/src/reducers";
import { bootstrapWorkers } from "devtools/client/debugger/src/utils/bootstrap";
import { setupDebuggerHelper } from "devtools/client/debugger/src/utils/dbg";
import { setupMessages } from "devtools/client/webconsole/actions/messages";
import { setupNetwork } from "devtools/client/webconsole/actions/network";
import consoleReducers from "devtools/client/webconsole/reducers";
import { getConsoleInitialState } from "devtools/client/webconsole/store";
import { prefs as consolePrefs } from "devtools/client/webconsole/utils/prefs";
import { initOutputSyntaxHighlighting } from "devtools/client/webconsole/utils/syntax-highlighted";
import { LocalizationHelper } from "devtools/shared/l10n";
import { Canvas, setupGraphics } from "protocol/graphics";
import { setupLogpoints } from "ui/actions/logpoint";
import { initSocket, addEventListener } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";
import { bindActionCreators } from "redux";
import { actions } from "ui/actions";
import { setupReactDevTools } from "ui/actions/reactDevTools";
import { selectors } from "ui/reducers";
import app, { setEventsForType, setVideoUrl } from "ui/reducers/app";
import comments from "ui/reducers/comments";
import contextMenus from "ui/reducers/contextMenus";
import network from "ui/reducers/network";
import protocolMessages from "ui/reducers/protocolMessages";
import reactDevTools from "ui/reducers/reactDevTools";
import timeline, { pointsReceived, setPlaybackStalled } from "ui/reducers/timeline";
import { DevToolsToolbox } from "ui/utils/devtools-toolbox";
import type { ThunkExtraArgs } from "ui/utils/thunk";
import {
  setMouseDownEventsCallback,
  setPausedonPausedAtTimeCallback,
  setPlaybackStatusCallback,
  setPointsReceivedCallback,
  setRefreshGraphicsCallback,
  setVideoUrlCallback,
} from "protocol/graphics";

import { extendStore, AppStore } from "../store";
import { setCanvas } from "ui/actions/app";
import { precacheScreenshots } from "ui/actions/timeline";
import { UnexpectedError } from "ui/state/app";

const { setupApp, setupTimeline } = actions;

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
  InactivityTimeout = 10,
}

const defaultMessaging: UnexpectedError = {
  action: "refresh",
  content: "Something went wrong while replaying, we'll look into it as soon as possible.",
  message: "Our apologies!",
};

// Reported reasons why a session can be destroyed.
const SessionErrorMessages: Record<number, Partial<UnexpectedError>> = {
  [SessionError.BackendDeploy]: {
    content: "Please wait a few minutes and try again.",
  },
  [SessionError.NodeTerminated]: {
    content: "Our servers hiccuped but things should be back to normal soon.",
  },
  [SessionError.UnknownFatalError]: {
    content: "Refreshing should help.\nIf not, please try recording again.",
  },
  [SessionError.KnownFatalError]: {
    content:
      "This error has been fixed in an updated version of Replay. Please try upgrading Replay and trying a new recording.",
  },
  [SessionError.OldBuild]: {
    content:
      "This error has been fixed in an updated version of Replay. Please try upgrading Replay and trying a new recording.",
  },
  [SessionError.LongRecording]: {
    content: "You’ve hit an error that happens with long recordings. Can you try a shorter one?",
  },
  [SessionError.InactivityTimeout]: {
    content: "Replays disconnect after 5 minutes to reduce server load.",
    message: "Ready when you are!",
  },
};

export default async function DevTools(store: AppStore) {
  if (window.hasAlreadyBootstrapped) {
    return;
  } else {
    window.hasAlreadyBootstrapped = true;
  }

  const url = new URL(window.location.href);
  const dispatchUrl = url.searchParams.get("dispatch") || process.env.NEXT_PUBLIC_DISPATCH_URL;
  assert(dispatchUrl, "no dispatchUrl");

  window.gToolbox = new DevToolsToolbox();

  window.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");

  window.app = window.app || {};
  window.app.threadFront = ThreadFront;
  window.app.actions = bindActionCreators(actions, store.dispatch);
  window.app.selectors = bindSelectors({ store, selectors });
  window.app.console = { prefs: consolePrefs };
  window.app.debugger = setupDebuggerHelper();
  window.app.prefs = window.app.prefs ?? {};

  const initialDebuggerState = await dbgClient.loadInitialState();
  const initialConsoleState = getConsoleInitialState();

  const initialState = {
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
    protocolMessages: protocolMessages,
    ...debuggerReducers,
    ...consoleReducers.reducers,
  };

  bootstrapWorkers();

  const extraThunkArgs: ThunkExtraArgs = {
    client: clientCommands,
    ThreadFront: ThreadFront,
  };

  extendStore(store, initialState, reducers, extraThunkArgs);

  dbgClient.bootstrap(store);

  const socket = initSocket(dispatchUrl);
  if (typeof window !== "undefined") {
    if (window.app != null) {
      // @ts-ignore
      window.app.socket = socket;
    }
  }

  addEventListener("Recording.uploadedData", (data: uploadedData) =>
    store.dispatch(actions.onUploadedData(data))
  );

  addEventListener("Recording.awaitingSourcemaps", () =>
    store.dispatch(actions.setAwaitingSourcemaps(true))
  );

  addEventListener("Recording.sessionError", (error: sessionError) => {
    store.dispatch(
      actions.setUnexpectedError({
        ...error,
        ...defaultMessaging,
        ...SessionErrorMessages[error.code],
      })
    );
  });

  setupApp(store, ThreadFront);
  setupTimeline(store);
  setupEventListeners(store);
  setupGraphics();
  initOutputSyntaxHighlighting();
  setupMessages(store, ThreadFront);
  setupNetwork(store, ThreadFront);
  setupLogpoints(store);
  setupExceptions(store);
  setupReactDevTools(store);

  // Add protocol event listeners for things that the Redux store needs to stay in sync with.
  // TODO We should revisit this as part of a larger architectural redesign (#6932).

  setMouseDownEventsCallback((events: MouseEvent[]) => {
    store.dispatch(setEventsForType({ events: [...events], eventType: "mousedown" }));
  });
  setPausedonPausedAtTimeCallback((time: number) => {
    store.dispatch(precacheScreenshots(time));
  });
  setPlaybackStatusCallback((stalled: boolean) => {
    store.dispatch(setPlaybackStalled(stalled));
  });
  setPointsReceivedCallback((points: TimeStampedPoint[]) => {
    store.dispatch(pointsReceived(points));
  });
  setRefreshGraphicsCallback((canvas: Canvas) => {
    store.dispatch(setCanvas(canvas));
  });
  setVideoUrlCallback((url: string) => {
    store.dispatch(setVideoUrl(url));
  });
}

function bindSelectors(obj: any) {
  return Object.keys(obj.selectors).reduce((bound, selector) => {
    bound[selector] = (a: any, b: any, c: any) =>
      obj.selectors[selector](obj.store.getState(), a, b, c);
    return bound;
  }, {} as any);
}
