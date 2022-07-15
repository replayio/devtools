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
import { actions, UIStore } from "ui/actions";
import { setupReactDevTools } from "ui/actions/reactDevTools";
import { selectors } from "ui/reducers";
import app, { setEventsForType, setVideoUrl } from "ui/reducers/app";
import contextMenus from "ui/reducers/contextMenus";
import network from "ui/reducers/network";
import protocolMessages from "ui/reducers/protocolMessages";
import reactDevTools from "ui/reducers/reactDevTools";
import timeline, { pointsReceived, setPlaybackStalled } from "ui/reducers/timeline";
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
import * as inspectorReducers from "devtools/client/inspector/reducers";

import { setCanvas } from "ui/actions/app";
import { precacheScreenshots } from "ui/actions/timeline";
import { UnexpectedError } from "ui/state/app";
import { ActionCreatorWithoutPayload, ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { UIState } from "ui/state";

const { setupApp, setupTimeline } = actions;

declare global {
  interface Window {
    L10N: any;
    hasAlreadyBootstrapped: boolean;
  }
  interface AppHelpers {
    threadFront?: typeof ThreadFront;
    actions?: any;
    selectors?: BoundSelectors;
    // We use 'command' in the backend and 'message' in the frontend so expose both :P
    console?: {
      prefs: typeof consolePrefs;
    };
    debugger?: any;
  }
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
    content: "Replays disconnect after 15 minutes to reduce server load.",
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

  window.L10N = new LocalizationHelper("devtools/client/locales/debugger.properties");

  const justSelectors = Object.fromEntries(
    Object.entries(selectors).filter(([key, value]) => {
      // The "selectors" object actually contains action creators, selectors, and other random bits.
      // We want to filter it down to _just_ selectors if possible.
      // We can eliminate anything that's not a function, _and_ anything that _appears_
      // to be an RTK action creator.  Technially a few non-selectors will sneak through at runtime,
      // but the runtime fields should _mostly_ match the TS types here.
      return (
        typeof value === "function" &&
        typeof (value as ActionCreatorWithoutPayload).type !== "string"
      );
    })
  ) as ObjectOfJustSelectorsHopefully;

  window.app = window.app || {};
  window.app.threadFront = ThreadFront;
  window.app.actions = bindActionCreators(actions, store.dispatch);
  window.app.selectors = bindSelectors(store, justSelectors);
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
  extendStore(store, {}, inspectorReducers, {});

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
        ...defaultMessaging,
        ...error,
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

// The original Big Ball O' Exports containing selectors + other fields
type SelectorsObject = typeof selectors;

// We expect that all Redux selectors take `state` as the first arg
type ReduxSelectorFunction = (state: UIState, ...any: any[]) => any;

// Do TS type transforms to extract "an object with just Redux selectors"
type ObjectOfJustSelectorsHopefully = Pick<
  SelectorsObject,
  KeysByType<SelectorsObject, ReduxSelectorFunction>
>;

// When we "bind" the selectors, we automatically pass in `state` as the first arg.
// Create TS types that reflect that by removing the first arg from the type signature,
// but still expect any other parameters.
type BoundSelectors = {
  [key in keyof ObjectOfJustSelectorsHopefully]: (
    ...args: Tail<Parameters<ObjectOfJustSelectorsHopefully[key]>>
  ) => ReturnType<ObjectOfJustSelectorsHopefully[key]>;
};

function bindSelectors(store: UIStore, selectors: ObjectOfJustSelectorsHopefully) {
  // NOTE: While the object is named `selectors`, our use of `export * from someSlice`
  // has caused a lot of action creators to be in the object as well.
  // Additionally, the "binding" of passing in `state` automatically messes up the TS types here.
  // I've attempted to get TS to accept that this is valid.
  return Object.entries(selectors).reduce((bound, [key, originalSelector]) => {
    // @ts-ignore
    bound[key as keyof BoundSelectors] = (...args: any[]) =>
      // @ts-ignore
      originalSelector(obj.store.getState(), ...args);
    return bound;
  }, {} as BoundSelectors);
}

export type UnknownFunction = (...args: any[]) => any;

type KeysByType<O extends object, T> = {
  [K in keyof O]-?: T extends O[K] ? K : never;
}[keyof O];

export type Tail<A> = A extends [any, ...infer Rest] ? Rest : never;
