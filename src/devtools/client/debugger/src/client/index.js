/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { bindActionCreators } from "redux";

const { ThreadFront } = require("protocol/thread");

import { setupCommands, clientCommands } from "./commands";
import { setupEvents, clientEvents } from "./events";

import { asyncStore, verifyPrefSchema } from "../utils/prefs";
import actions from '../actions'
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

function syncXHRBreakpoints() {
  asyncStore.xhrBreakpoints.then(bps => {
    bps.forEach(({ path, method, disabled }) => {
      if (!disabled) {
        clientCommands.setXHRBreakpoint(path, method);
      }
    });
  });
}

export async function loadInitialState() {
  const pendingBreakpoints = await asyncStore.pendingBreakpoints;
  const tabs = { tabs: await asyncStore.tabs };
  const xhrBreakpoints = await asyncStore.xhrBreakpoints;

  const breakpoints = initialBreakpointsState(xhrBreakpoints);

  return {
    pendingBreakpoints,
    tabs,
    breakpoints,
  };
}

let boundActions;
let store;

export function bootstrap(_store) {
  store = _store;
  boundActions = bindActionCreators(actions, store.dispatch);

  verifyPrefSchema();
  setupCommands();
  setupEvents({ actions: boundActions });
  store.subscribe(() => updatePrefs(store.getState()));
}

export async function onConnect() {
  store.dispatch(actions.connect("", ThreadFront.actor, {}, false));

  ThreadFront.findScripts(({ scriptId, url, sourceMapURL }) =>
    clientEvents.newSource(ThreadFront, {
      source: {
        actor: scriptId,
        url,
        sourceMapURL,
      }
    })
  );


  await syncBreakpoints();
  syncXHRBreakpoints();
  return { store, actions: boundActions, selectors, client: clientCommands };
}
