import {
  configureStore,
  combineReducers,
  Store,
  Middleware,
  Reducer,
  ThunkDispatch,
  AnyAction,
} from "@reduxjs/toolkit";
import { Immer, enableMapSet } from "immer";
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import { UIAction } from "ui/actions";
import { UIState } from "ui/state";
import { ThunkExtraArgs, extraThunkArgs } from "ui/utils/thunk";
import LogRocket from "ui/utils/logrocket";
import appReducer from "ui/reducers/app";
import layoutReducer from "ui/reducers/layout";
import tabsReducer from "devtools/client/debugger/src/reducers/tabs";

import { context } from "ui/setup/redux/middleware/context";
import hitCounts from "ui/reducers/hitCounts";
import possibleBreakpoints from "ui/reducers/possibleBreakpoints";
import protocolMessages from "ui/reducers/protocolMessages";
import sources from "ui/reducers/sources";

import { listenerMiddleware } from "./listenerMiddleware";

type UIStateReducers = {
  [key in keyof UIState]: Reducer<UIState[key]>;
};

// TODO This isn't exported from RTK. Mark should fix that.
type ReduxDevToolsOptions = Exclude<
  Parameters<typeof configureStore>[0]["devTools"],
  boolean | undefined
>;

// HACK We know that other slices are being lazy-loaded later.
// This should probably be rewritten at some point.
// In the meantime, type the `reducers` object to represent the other
// slice reducers we know will be added, to get the right state type.
let reducers = {
  app: appReducer,
  sources: sources,
  hitCounts: hitCounts,
  layout: layoutReducer,
  possibleBreakpoints: possibleBreakpoints,
  protocolMessages: protocolMessages,
  tabs: tabsReducer,
} as unknown as UIStateReducers;

// Immer auto-freezes state by default. However, this does take some time, and also we are
// apparently currently mutating state in ManagedTree.js, so that throws an error if frozen.
// Create a custom Immer instance that does not autofreeze.
const customImmer = new Immer({ autoFreeze: false });

// This _should_ be our UIState type, but I'm getting "<S> is not assignable to UIState" TS errors
const sanitizeStateForDevtools = <S>(state: S) => {
  const OMITTED = "<OMITTED>";
  enableMapSet();

  // Use Immer to simplify nested immutable updates when making a copy of the state
  const sanitizedState = customImmer.produce(state, (draft: any) => {
    if (draft.sources) {
      Object.values(draft.sources.contents.entities).forEach((contentsItem: any) => {
        if (contentsItem.value) {
          contentsItem.value.value = OMITTED;
        }
      });
    }

    if (draft.pause) {
      draft.pause.frames = OMITTED;
      draft.pause.frameScopes = OMITTED;
    }

    if (draft.protocolMessages) {
      draft.protocolMessages = OMITTED;
    }

    if (draft.preview?.preview) {
      draft.preview.preview = OMITTED;
    }
  });

  return sanitizedState as S;
};

const reduxDevToolsOptions: ReduxDevToolsOptions = {
  maxAge: 100,
  stateSanitizer: sanitizeStateForDevtools,
  trace: true,
  // @ts-ignore This field has been renamed, but RTK types haven't caught up yet
  actionsDenylist: [
    "protocolMessages/eventReceived",
    "protocolMessages/responseReceived",
    "protocolMessages/errorReceived",
    "protocolMessages/requestSent",
    "app/setHoveredLineNumberLocation",
    "app/durationSeen",
    "timeline/setPlaybackPrecachedTime",
  ],
};

export function bootstrapStore(initialState: Partial<UIState>) {
  type UIStateMiddleware = Middleware<
    {},
    UIState,
    ThunkDispatch<UIState, ThunkExtraArgs, UIAction>
  >;

  const store = configureStore({
    reducer: reducers,
    preloadedState: initialState,
    // @ts-ignore
    middleware: gDM => {
      const originalMiddlewareArray = gDM({
        // TODO Disabling these checks is not _good_. But we know they fail now anyway.
        // TODO Fix the offending code and turn these on.
        serializableCheck: false,
        immutableCheck: false,
        thunk: {
          extraArgument: extraThunkArgs,
        },
      }).prepend(listenerMiddleware.middleware);

      let updatedMiddlewareArray = originalMiddlewareArray.concat([context] as UIStateMiddleware[]);

      const telemetryMiddleware = skipTelemetry()
        ? undefined
        : (LogRocket.reduxMiddleware() as UIStateMiddleware);

      if (telemetryMiddleware) {
        updatedMiddlewareArray = updatedMiddlewareArray.concat(telemetryMiddleware);
      }

      return updatedMiddlewareArray as typeof originalMiddlewareArray;
    },
    devTools: process.env.NODE_ENV === "production" ? false : reduxDevToolsOptions,
  });

  return store;
}

export type AppStore = ReturnType<typeof bootstrapStore>;
// TODO Actually duplicated this with ./index.ts
export type AppDispatch = AppStore["dispatch"];

export function extendStore(
  store: Store,
  newInitialState: Record<string, any> | undefined,
  newReducers: Record<string, any>,
  newThunkArgs: Record<string, any>
) {
  Object.assign(reducers, newReducers);
  Object.assign(extraThunkArgs, newThunkArgs);

  const combinedReducers = combineReducers(reducers);
  const reducer = (state: UIState | undefined, action: UIAction) => {
    if (newInitialState) {
      state = { ...newInitialState, ...state } as UIState;
      newInitialState = undefined;
    }
    return combinedReducers(state, action) as UIState;
  };

  store.replaceReducer(reducer);
}
