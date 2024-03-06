import {
  Middleware,
  Reducer,
  Store,
  ThunkDispatch,
  combineReducers,
  configureStore,
} from "@reduxjs/toolkit";
import { Immer } from "immer";

import tabsReducer from "devtools/client/debugger/src/reducers/tabs";
import { skipTelemetry } from "shared/utils/environment";
import { UIAction } from "ui/actions";
import appReducer from "ui/reducers/app";
import layoutReducer from "ui/reducers/layout";
import protocolMessages from "ui/reducers/protocolMessages";
import sources from "ui/reducers/sources";
import { context } from "ui/setup/redux/middleware/context";
import { UIState } from "ui/state";
import LogRocket from "ui/utils/logrocket";
import { ThunkExtraArgs, extraThunkArgs } from "ui/utils/thunk";

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
  layout: layoutReducer,
  protocolMessages: protocolMessages,
  tabs: tabsReducer,
} as unknown as UIStateReducers;

// Immer auto-freezes state by default. However, this does take some time, and also we are
// apparently currently mutating state in ManagedTree.js, so that throws an error if frozen.
// Create a custom Immer instance that does not autofreeze.
const customImmer = new Immer({ autoFreeze: false });
const OMITTED = "<OMITTED>";

// This _should_ be our UIState type, but I'm getting "<S> is not assignable to UIState" TS errors
const sanitizeStateForDevtools = <S>(state: S) => {
  // Use Immer to simplify nested immutable updates when making a copy of the state
  const sanitizedState = customImmer.produce(state, (draft: UIState) => {
    if (draft.protocolMessages) {
      // @ts-expect-error
      draft.protocolMessages = OMITTED;
    }
  });

  return sanitizedState as S;
};

const reduxDevToolsOptions: ReduxDevToolsOptions = {
  maxAge: 100,
  stateSanitizer: sanitizeStateForDevtools,
  trace: true,
  actionsDenylist: [
    "protocolMessages/eventReceived",
    "protocolMessages/responseReceived",
    "protocolMessages/errorReceived",
    "protocolMessages/requestSent",
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
    devTools: reduxDevToolsOptions,
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
