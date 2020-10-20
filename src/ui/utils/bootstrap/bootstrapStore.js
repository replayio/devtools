import { prefs, asyncStore } from "../prefs";
import { combineReducers, applyMiddleware } from "redux";
import { reducers, selectors } from "../../reducers";
import { setupAppHelper } from "./helpers";
import configureStore from "devtools/client/debugger/src/actions/utils/create-store";
import { clientCommands } from "devtools/client/debugger/src/client/firefox/commands";
import LogRocket from "ui/utils/logrocket";

async function getInitialState() {
  const eventListenerBreakpoints = await asyncStore.eventListenerBreakpoints;
  return {
    eventListenerBreakpoints,
  };
}

function registerStoreObserver(store, subscriber) {
  let oldState = store.getState();
  store.subscribe(() => {
    const state = store.getState();
    subscriber(state, oldState);
    oldState = state;
  });
}

export const bootstrapStore = async function bootstrapStore(skipTelemetry) {
  const createStore = configureStore({
    makeThunkArgs: (args, state) => {
      return { ...args, client: clientCommands };
    },
  });

  const initialState = await getInitialState();
  const middleware = skipTelemetry ? undefined : applyMiddleware(LogRocket.reduxMiddleware());

  const store = createStore(combineReducers(reducers), initialState, middleware);
  registerStoreObserver(store, updatePrefs);

  setupAppHelper(store);

  return store;
};

function updatePrefs(state, oldState) {
  function updatePref(field, selector) {
    if (selector(state) != selector(oldState)) {
      prefs[field] = selector(state);
    }
  }
  function updateAsyncPref(field, selector) {
    if (selector(state) != selector(oldState)) {
      asyncStore[field] = selector(state);
    }
  }

  updatePref("isToolboxOpen", selectors.isToolboxOpen);
  updatePref("splitConsole", selectors.isSplitConsoleOpen);
  updatePref("user", selectors.getUser);
  updatePref("selectedPanel", selectors.getSelectedPanel);
  updateAsyncPref("eventListenerBreakpoints", state => state.eventListenerBreakpoints);
}
