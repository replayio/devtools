import {
  configureStore,
  combineReducers,
  Store,
  Middleware,
  Reducer,
  AnyAction,
} from "@reduxjs/toolkit";
import { Immer, enableMapSet } from "immer";
import { UIAction } from "ui/actions";
import { UIState } from "ui/state";
import { ThunkExtraArgs } from "ui/utils/thunk";
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import LogRocket from "ui/utils/logrocket";
import { sanityCheckMiddleware, sanitize } from "ui/utils/sanitize";
import appReducer from "ui/reducers/app";
import layoutReducer from "ui/reducers/layout";
import tabsReducer from "devtools/client/debugger/src/reducers/tabs";
import { AppState } from "ui/state/app";
import { LayoutState } from "ui/state/layout";

import { promise } from "ui/setup/redux/middleware/promise";
import { context } from "ui/setup/redux/middleware/context";

type UIStateReducers = {
  [key in keyof UIState]: Reducer<UIState[key]>;
};

// HACK We know that other slices are being lazy-loaded later.
// This should probably be rewritten at some point.
// In the meantime, type the `reducers` object to represent the other
// slice reducers we know will be added, to get the right state type.
let reducers = {
  app: appReducer,
  layout: layoutReducer,
  tabs: tabsReducer,
} as unknown as UIStateReducers;
let extraThunkArgs = {} as ThunkExtraArgs;

// Immer auto-freezes state by default. However, this does take some time, and also we are
// apparently currently mutating state in ManagedTree.js, so that throws an error if frozen.
// Create a custom Immer instance that does not autofreeze.
const customImmer = new Immer({ autoFreeze: false });

const sanitizeStateForDevtools = (state: UIState) => {
  enableMapSet();
  const OMITTED = "<OMITTED>";

  const sanitizeContentItem = (item: any) => {
    if (item.content?.value) {
      item.content.value.value = OMITTED;
    }
  };

  // The state appears to contain several "content" items, which may be either an
  // object or an array of objects, containing the source strings nested inside.
  // Handle either case.
  const sanitizeContents = (rootContents: any) => {
    if (!rootContents) {
      return;
    }

    if (Array.isArray(rootContents)) {
      rootContents.forEach(item => sanitizeContentItem(item));
    } else {
      sanitizeContentItem(rootContents);
    }
  };

  // Use Immer to simplify nested immutable updates when making a copy of the state
  const sanitizedState = customImmer.produce(state, (draft: any) => {
    if (draft.app) {
      // TODO This is a DOM node in the Redux state and shouldn't even be here anyway
      draft.app.videoNode = OMITTED;
    }

    sanitizeContents(draft.sources?.focusedItem?.contents);
    sanitizeContents(draft.sourceTree?.focusedItem?.contents);

    if (draft.sources) {
      // This is a large lookup table of source string related values
      draft.sources.sources = OMITTED;
    }

    if (draft.pause) {
      draft.pause.frames = OMITTED;
      draft.pause.frameScopes = OMITTED;
    }

    if (draft.messages?.messagesById) {
      // This may contain nested `ValueFront` objects, which cause lots of
      // "Not Allowed" messages when serialized.
      // TODO Make this more precise later
      draft.messages.messagesById = OMITTED;
    }
  });

  return sanitizedState;
};

const sanitizeActionForDevTools = (action: AnyAction) => {
  // Actions may contain `ValueFront` objects
  const sanitizedAction = customImmer.produce(action, draft => {
    return sanitize(draft, "", `sanitizedAction[${action.type}]`, false);
  });

  // @ts-ignore
  if (sanitizedAction.videoNode) {
    // @ts-ignore
    delete sanitizedAction.videoNode;
  }

  return sanitizedAction;
};

export function bootstrapStore(initialState: { app: AppState; layout: LayoutState }) {
  type UIStateMiddleware = Middleware<{}, UIState>;

  const store = configureStore({
    // NOTE: This is only the _initial_ setup! Other reducers are code-split for now.
    // See devtools.ts and devtools-toolbox.ts for other reducers
    reducer: reducers,
    // @ts-ignore
    middleware: gDM => {
      let middlewareArray = gDM({
        thunk: {
          extraArgument: extraThunkArgs,
        },
      }).concat([promise, context] as UIStateMiddleware[]);

      const telemetryMiddleware = skipTelemetry()
        ? isDevelopment()
          ? sanityCheckMiddleware
          : undefined
        : (LogRocket.reduxMiddleware() as UIStateMiddleware);

      if (telemetryMiddleware) {
        middlewareArray = middlewareArray.concat(telemetryMiddleware);
      }

      return middlewareArray;
    },
    // @ts-ignore Type 'S' is not assignable to type 'UIState'
    devTools:
      process.env.NODE_ENV === "production"
        ? false
        : {
            stateSanitizer: sanitizeStateForDevtools,
            actionSanitizer: sanitizeActionForDevTools,
          },
  });

  return store;
}

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
