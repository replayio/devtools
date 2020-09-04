/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import * as firefox from "./firefox";

import { asyncStore, verifyPrefSchema } from "../utils/prefs";
import { setupHelper } from "../utils/dbg";

import { bootstrapApp, bootstrapStore, bootstrapWorkers } from "../utils/bootstrap";

import { initialBreakpointsState } from "../reducers/breakpoints";

async function syncBreakpoints() {
  const breakpoints = await asyncStore.pendingBreakpoints;
  const breakpointValues = Object.values(breakpoints);
  breakpointValues.forEach(({ disabled, options, location }) => {
    if (!disabled) {
      firefox.clientCommands.setBreakpoint(location, options);
    }
  });
}

function syncXHRBreakpoints() {
  asyncStore.xhrBreakpoints.then(bps => {
    bps.forEach(({ path, method, disabled }) => {
      if (!disabled) {
        firefox.clientCommands.setXHRBreakpoint(path, method);
      }
    });
  });
}

async function loadInitialState() {
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

function getClient(connection) {
  return firefox;
}

export async function onConnect(connection, panelWorkers, panel) {
  // NOTE: the landing page does not connect to a JS process
  if (!connection) {
    return;
  }

  verifyPrefSchema();

  const client = getClient(connection);
  const commands = client.clientCommands;

  const initialState = await loadInitialState();
  const workers = bootstrapWorkers(panelWorkers);

  panel.parserDispatcher = workers.parser;

  const { store, actions, selectors } = bootstrapStore(commands, workers, panel, initialState);

  const connected = client.onConnect(connection, actions, panel);

  await syncBreakpoints();
  syncXHRBreakpoints();
  setupHelper({
    store,
    actions,
    selectors,
    workers,
    connection,
    client: client.clientCommands,
  });

  await connected;
  return { store, actions, selectors, client: commands };
}
