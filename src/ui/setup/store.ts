import { combineReducers, applyMiddleware, Store, compose } from "redux";
import { devToolsEnhancer, EnhancerOptions } from "@redux-devtools/extension";
import { Immer, enableMapSet } from "immer";
import { UIAction } from "ui/actions";
import { UIState } from "ui/state";
import { ValueFront } from "protocol/thread";
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import LogRocket from "ui/utils/logrocket";
import { sanityCheckMiddleware, sanitize } from "ui/utils/sanitize";
const configureStore = require("./redux/create-store").default;
import appReducer from "ui/reducers/app";
import layoutReducer from "ui/reducers/layout";
import tabsReducer from "devtools/client/debugger/src/reducers/tabs";
import { AppState } from "ui/state/app";
import { LayoutState } from "ui/state/layout";

let reducers: Record<string, any> = { app: appReducer, layout: layoutReducer, tabs: tabsReducer };
let thunkArgs: Record<string, any> = {};

// Immer auto-freezes state by default. However, this does take some time, and also we are
// apparently currently mutating state in ManagedTree.js, so that throws an error if frozen.
// Create a custom Immer instance that does not autofreeze.
const customImmer = new Immer({ autoFreeze: false });

export function bootstrapStore(initialState: { app: AppState; layout: LayoutState }) {
  // TODO; manage panels outside of the Toolbox componenet
  const panels = {};

  const createStore = configureStore({
    makeThunkArgs: (args: object) => {
      return {
        ...args,
        ...thunkArgs,
        panels,
        toolbox: window.gToolbox,
      };
    },
  });

  // TODO This appears to be a second middleware chain - the other is in `create-store.js`.
  // Having two middleware chains technically works, but isn't a great idea.
  const middleware = skipTelemetry()
    ? isDevelopment()
      ? applyMiddleware(sanityCheckMiddleware)
      : undefined
    : applyMiddleware(LogRocket.reduxMiddleware());

  // Set up the Redux DevTools extension, in local dev only
  const devTools = devToolsEnhancer({
    // The Replay state is huge, and often contains large source code text strings.
    // This causes both the DevTools Extension and the app code to lag badly as the
    // DevTools interop attempts to serialize the state over to the extension.
    // To optimize perf, we "sanitize" the state before serialization, by replacing
    // large values with a simple "OMITTED" string.
    stateSanitizer: state => {
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
    },
    actionSanitizer: action => {
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
    },
  });

  // Work around case where `middleware` may be undefined
  const composedEnhancers = middleware ? compose(middleware, devTools) : devTools;

  return createStore(combineReducers(reducers), initialState, composedEnhancers);
}

export function extendStore(
  store: Store,
  newInitialState: Record<string, any> | undefined,
  newReducers: Record<string, any>,
  newThunkArgs: Record<string, any>
) {
  reducers = { ...reducers, ...newReducers };
  thunkArgs = { ...thunkArgs, ...newThunkArgs };

  const combinedReducers = combineReducers(reducers) as any;
  const reducer = (state: UIState | undefined, action: UIAction) => {
    if (newInitialState) {
      state = { ...newInitialState, ...state } as UIState;
      newInitialState = undefined;
    }
    return combinedReducers(state, action) as UIState;
  };

  store.replaceReducer(reducer);
}
