// Side-effectful import, has to be imported before event-listeners
// Ordering matters here
import "devtools/client/inspector/prefs";
import { ActionCreatorWithoutPayload } from "@reduxjs/toolkit";
import { bindActionCreators } from "@reduxjs/toolkit";
import { MouseEvent, TimeStampedPoint, sessionError, uploadedData } from "@replayio/protocol";
import debounce from "lodash/debounce";

import {
  getCachedObject,
  getObjectPropertyHelper,
  getObjectThrows,
  getObjectWithPreviewHelper,
} from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import { setupSourcesListeners } from "devtools/client/debugger/src/actions/sources";
import * as dbgClient from "devtools/client/debugger/src/client";
import debuggerReducers from "devtools/client/debugger/src/reducers";
import { bootstrapWorkers } from "devtools/client/debugger/src/utils/bootstrap";
import { setupDebuggerHelper } from "devtools/client/debugger/src/utils/dbg";
import { setupBoxModel } from "devtools/client/inspector/boxmodel/actions/box-model";
import { setupMarkup } from "devtools/client/inspector/markup/actions/markup";
import * as inspectorReducers from "devtools/client/inspector/reducers";
import { setupRules } from "devtools/client/inspector/rules/actions/rules";
import { setupNetwork } from "devtools/client/webconsole/actions/network";
import { initOutputSyntaxHighlighting } from "devtools/client/webconsole/utils/syntax-highlighted";
import { setPointsReceivedCallback as setAnalysisPointsReceivedCallback } from "protocol/analysisManager";
import { Canvas, setAllPaintsReceivedCallback, setupGraphics } from "protocol/graphics";
import {
  setMouseDownEventsCallback,
  setPausedonPausedAtTimeCallback,
  setPlaybackStatusCallback,
  setPointsReceivedCallback,
  setRefreshGraphicsCallback,
  setVideoUrlCallback,
} from "protocol/graphics";
// eslint-disable-next-line no-restricted-imports
import { addEventListener, initSocket, client as protocolClient } from "protocol/socket";
import { ThreadFront } from "protocol/thread";
import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";
import { UIStore, actions } from "ui/actions";
import { setCanvas } from "ui/actions/app";
import { setupReactDevTools } from "ui/actions/reactDevTools";
import { precacheScreenshots } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import app, { loadReceivedEvents, setVideoUrl } from "ui/reducers/app";
import contextMenus from "ui/reducers/contextMenus";
import network from "ui/reducers/network";
import protocolMessages from "ui/reducers/protocolMessages";
import reactDevTools from "ui/reducers/reactDevTools";
import timeline, {
  allPaintsReceived,
  paintsReceived,
  pointsReceivedThunk,
  setPlaybackStalled,
} from "ui/reducers/timeline";
import { UIState } from "ui/state";
import { UnexpectedError } from "ui/state/app";
import { setupGetPreferredLocation } from "ui/utils/preferredLocation";
import type { ThunkExtraArgs } from "ui/utils/thunk";

import { startAppListening } from "../listenerMiddleware";
import { AppStore, extendStore } from "../store";

const { setupApp, setupTimeline } = actions;

declare global {
  interface Window {
    hasAlreadyBootstrapped: boolean;
  }
  interface AppHelpers {
    threadFront?: typeof ThreadFront;
    actions?: ResolveThunks<typeof actions>;
    selectors?: BoundSelectors;
    debugger?: any;

    PointsContext?: any;
    SourcesCache?: any;
    replayClient?: ReplayClientInterface;
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
      "This recording is no longer available because we have updated Replay. Please try recording a new replay.",
  },
  [SessionError.LongRecording]: {
    content: "You’ve hit an error that happens with long recordings. Can you try a shorter one?",
  },
  [SessionError.InactivityTimeout]: {
    content: "This replay timed out to reduce server load.",
    message: "Ready when you are!",
  },
};

export default async function setupDevtools(store: AppStore, replayClient: ReplayClientInterface) {
  if (window.hasAlreadyBootstrapped) {
    return;
  } else {
    window.hasAlreadyBootstrapped = true;
  }

  const url = new URL(window.location.href);
  const dispatchUrl = url.searchParams.get("dispatch") || process.env.NEXT_PUBLIC_DISPATCH_URL;
  assert(dispatchUrl, "no dispatchUrl");

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
  // @ts-expect-error complains about thunk type mismatches
  window.app.actions = bindActionCreators(actions, store.dispatch);
  window.app.selectors = bindSelectors(store, justSelectors);
  window.app.debugger = setupDebuggerHelper();
  window.app.prefs = window.app.prefs ?? {};

  const initialState = {};

  const reducers = {
    app,
    contextMenus,
    network,
    reactDevTools,
    timeline,
    protocolMessages: protocolMessages,
    ...debuggerReducers,
  };

  bootstrapWorkers();

  const extraThunkArgs: ThunkExtraArgs = {
    ThreadFront,
    replayClient,
    protocolClient,
    objectCache: {
      getCachedObject,
      getObjectThrows,
      getObjectWithPreviewHelper,
      getObjectPropertyHelper,
    },
  };

  // Add all these new slice reducers and some related state in a single call,
  // which avoids weirdness in local dev with the Redux DevTools not passing in
  // state from earlier if there's multiple `extendStore` calls
  extendStore(store, initialState, { ...reducers, ...inspectorReducers }, extraThunkArgs);

  setupSourcesListeners(startAppListening);
  setupMarkup(store, startAppListening);

  dbgClient.bootstrap(store, ThreadFront, replayClient);

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

  await setupApp(store, ThreadFront, replayClient);
  setupTimeline(store);
  setupGraphics();
  initOutputSyntaxHighlighting();
  setupNetwork(store, ThreadFront);
  setupReactDevTools(store, ThreadFront);
  setupBoxModel(store, startAppListening);
  setupRules(store, startAppListening);
  setupGetPreferredLocation(store);

  // Add protocol event listeners for things that the Redux store needs to stay in sync with.
  // TODO We should revisit this as part of a larger architectural redesign (#6932).

  setMouseDownEventsCallback(
    // We seem to get duplicate mousedown events each time, like ["a"], ["a"], ["a", "b"], ["a", "b"], etc.
    // Debounce the callback so we only dispatch the last set.
    debounce((events: MouseEvent[]) => {
      if (!events.length) {
        // No reason to dispatch when there's 0 events
        return;
      }

      //
      store.dispatch(loadReceivedEvents({ mousedown: [...events] }));
    }, 1_000)
  );
  setPausedonPausedAtTimeCallback((time: number) => {
    store.dispatch(precacheScreenshots(time));
  });
  setPlaybackStatusCallback((stalled: boolean) => {
    store.dispatch(setPlaybackStalled(stalled));
  });

  // Points come in piecemeal over time. Cut down the number of dispatches by
  // storing incoming points and debouncing the dispatch considerably.
  let points: TimeStampedPoint[] = [];

  const onPointsReceived = debounce(() => {
    store.dispatch(pointsReceivedThunk(points.map(({ point, time }) => ({ point, time }))));
    store.dispatch(paintsReceived(points.filter(p => "screenShots" in p)));
    points = [];
  }, 1_000);

  setPointsReceivedCallback(newPoints => {
    points.push(...newPoints);
    onPointsReceived();
  });

  setAnalysisPointsReceivedCallback(newPoints => {
    points.push(...newPoints);
    onPointsReceived();
  });

  setAllPaintsReceivedCallback((received: boolean) => {
    store.dispatch(allPaintsReceived(received));
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
type ReduxSelectorFunction = ((state: UIState, ...any: any[]) => any) | ((state: UIState) => any);

// Do TS type transforms to extract "an object with just Redux selectors"
type ObjectOfJustSelectorsHopefully = Pick<
  SelectorsObject,
  KeysAssignableToType<SelectorsObject, ReduxSelectorFunction>
>;

type SelectorWithoutStateArg<T extends ReduxSelectorFunction> = (
  ...args: Tail<Parameters<T>>
) => ReturnType<T>;

// When we "bind" the selectors, we automatically pass in `state` as the first arg.
// Create TS types that reflect that by removing the first arg from the type signature,
// but still expect any other parameters.
export type BoundSelectors = {
  [key in keyof ObjectOfJustSelectorsHopefully]: SelectorWithoutStateArg<
    ObjectOfJustSelectorsHopefully[key]
  >;
};

export function bindSelectors(store: UIStore, selectors: Partial<ObjectOfJustSelectorsHopefully>) {
  // NOTE: While the object is named `selectors`, our use of `export * from someSlice`
  // has caused a lot of action creators to be in the object as well.
  // Additionally, the "binding" of passing in `state` automatically messes up the TS types here.
  // I've attempted to get TS to accept that this is valid.
  return Object.entries(selectors).reduce((bound, [key, originalSelector]) => {
    // @ts-expect-error
    bound[key as keyof BoundSelectors] = (...args: any[]) =>
      // @ts-expect-error
      originalSelector(store.getState(), ...args);
    return bound;
  }, {} as BoundSelectors);
}

export type UnknownFunction = (...args: any[]) => any;

type KeysAssignableToType<O extends object, T> = {
  [K in keyof O]-?: O[K] extends T ? K : never;
}[keyof O];

export type Tail<A> = A extends [any, ...infer Rest] ? Rest : never;

// Stolen from React-Redux. Cuts out the "returns a thunk function"
// part of a thunk action creator to reflect how it works when dispatched.
export type InferThunkActionCreatorType<TActionCreator extends (...args: any[]) => any> =
  TActionCreator extends (...args: infer TParams) => (...args: any[]) => infer TReturn
    ? (...args: TParams) => TReturn
    : TActionCreator;

export type HandleThunkActionCreator<TActionCreator> = TActionCreator extends (
  ...args: any[]
) => any
  ? InferThunkActionCreatorType<TActionCreator>
  : TActionCreator;

// redux-thunk middleware returns thunk's return value from dispatch call
// https://github.com/reduxjs/redux-thunk#composition
export type ResolveThunks<TDispatchProps> = TDispatchProps extends {
  [key: string]: any;
}
  ? {
      [C in keyof TDispatchProps]: HandleThunkActionCreator<TDispatchProps[C]>;
    }
  : TDispatchProps;
