/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { bindActionCreators } from "redux";

import actions from "../actions";
import { initialBreakpointsState } from "../reducers/breakpoints";
import * as selectors from "../selectors";
import { updatePrefs } from "../utils/bootstrap";
import { asyncStore, verifyPrefSchema } from "../utils/prefs";

import { setupCommands, clientCommands } from "./commands";
import { prepareSourcePayload } from "./create";
import { setupEvents } from "./events";

const { ThreadFront } = require("protocol/thread");

export async function loadInitialState() {
  const pendingBreakpoints = await asyncStore.pendingBreakpoints;
  const breakpoints = initialBreakpointsState();

  return {
    breakpoints,
    pendingBreakpoints,
  };
}

let boundActions;
let store;

async function setupDebugger() {
  const sourceInfos = [];
  await ThreadFront.findSources(({ sourceId, url, sourceMapURL }) =>
    sourceInfos.push({
      data: prepareSourcePayload({
        actor: sourceId,
        sourceMapURL,
        url,
      }),
      type: "generated",
    })
  );
  await store.dispatch(actions.newQueuedSources(sourceInfos));
  store.dispatch({ type: "SOURCES_LOADED" });
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
  return { actions: boundActions, client: clientCommands, selectors, store };
}
