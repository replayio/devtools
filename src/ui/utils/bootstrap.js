import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { prefs } from "devtools/client/debugger/src/utils/prefs";
import configureStore from "devtools/client/debugger/src/actions/utils/create-store";
import { bindActionCreators, combineReducers } from "redux";
import { reducers, selectors } from "../reducers";
import { actions } from "../actions";
import App from "ui/components/App";

const initialState = {};

function bindSelectors(obj) {
  return Object.keys(obj.selectors).reduce((bound, selector) => {
    bound[selector] = (a, b, c) =>
      obj.selectors[selector](obj.store.getState(), a, b, c);
    return bound;
  }, {});
}

function bootstrapStore() {
  const createStore = configureStore({
    log: prefs.logging,
    timing: prefs.timing,
    makeThunkArgs: (args, state) => {
      return { ...args };
    },
  });

  const store = createStore(combineReducers(reducers), initialState);

  window.app = {
    store,
    actions: bindActionCreators(actions, store.dispatch),
    selectors: bindSelectors({ store, selectors }),
  };

  return store;
}

export function bootstrapApp(props) {
  const store = bootstrapStore();

  ReactDOM.render(
    React.createElement(Provider, { store }, React.createElement(App, props)),
    document.querySelector("#viewer")
  );
}
