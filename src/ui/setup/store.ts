import { combineReducers, applyMiddleware, Store } from "redux";
import { composeWithDevToolsDevelopmentOnly } from "@redux-devtools/extension";
import { UIAction } from "ui/actions";
import { UIState } from "ui/state";
import { isDevelopment, skipTelemetry } from "ui/utils/environment";
import LogRocket from "ui/utils/logrocket";
import { sanityCheckMiddleware } from "ui/utils/sanitize";
const configureStore = require("./redux/create-store").default;
import appReducer from "ui/reducers/app";
import layoutReducer from "ui/reducers/layout";
import tabsReducer from "devtools/client/debugger/src/reducers/tabs";
import { AppState } from "ui/state/app";
import { LayoutState } from "ui/state/layout";

let reducers: Record<string, any> = { app: appReducer, layout: layoutReducer, tabs: tabsReducer };
let thunkArgs: Record<string, any> = {};

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

  const middleware = skipTelemetry()
    ? isDevelopment()
      ? applyMiddleware(sanityCheckMiddleware)
      : undefined
    : applyMiddleware(LogRocket.reduxMiddleware());

  // Work around case where `middleware` may be undefined
  const composedEnhancers = middleware
    ? composeWithDevToolsDevelopmentOnly(middleware)
    : composeWithDevToolsDevelopmentOnly();

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
