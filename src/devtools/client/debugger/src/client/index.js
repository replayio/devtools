/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { bindActionCreators } from "redux";

const { ThreadFront } = require("protocol/thread");

import { setupCommands, clientCommands } from "./commands";
import { setupEvents, clientEvents } from "./events";

import { asyncStore, verifyPrefSchema } from "../utils/prefs";
import actions from "../actions";
import * as selectors from "../selectors";

import { updatePrefs } from "../utils/bootstrap";
import { initialBreakpointsState } from "../reducers/breakpoints";

async function syncBreakpoints() {
  const breakpoints = await asyncStore.pendingBreakpoints;
  const breakpointValues = Object.values(breakpoints);
  breakpointValues.forEach(({ disabled, options, location }) => {
    if (!disabled) {
      clientCommands.setBreakpoint(location, options);
    }
  });
}

export async function loadInitialState() {
  const pendingBreakpoints = await asyncStore.pendingBreakpoints;
  const tabs = { tabs: await asyncStore.tabs };

  const breakpoints = initialBreakpointsState();

  return {
    pendingBreakpoints,
    tabs,
    breakpoints,
  };
}

let boundActions;
let store;

async function setupDebugger() {
  store.dispatch(actions.connect("", ThreadFront.actor, {}, false));

  await ThreadFront.findSources(({ sourceId, url, sourceMapURL }) =>
    clientEvents.newSource(ThreadFront, {
      source: {
        actor: sourceId,
        url,
        sourceMapURL,
      },
    })
  );
  store.dispatch({ type: "SOURCES_LOADED" });

  syncBreakpoints();
}

export function bootstrap(_store) {
  store = _store;
  boundActions = bindActionCreators(actions, store.dispatch);

  setupDebugger();

  verifyPrefSchema();
  setupCommands();
  setupEvents({ actions: boundActions });
  store.subscribe(() => updatePrefs(store.getState()));
}

export function onConnect() {
  return { store, actions: boundActions, selectors, client: clientCommands };
}
