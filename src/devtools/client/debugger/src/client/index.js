/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { ThreadFront } from "protocol/thread";
import { bindActionCreators } from "redux";

import actions from "../actions";
import { initialBreakpointsState } from "../reducers/breakpoints";
import * as selectors from "../selectors";
import { asyncStore, verifyPrefSchema } from "../utils/prefs";

import { setupCommands, clientCommands, prepareSourcePayload } from "./commands";
import { setupEvents } from "./events";

export async function loadInitialState() {
  const pendingBreakpoints = await asyncStore.pendingBreakpoints;
  const breakpoints = initialBreakpointsState();

  return {
    pendingBreakpoints,
    breakpoints,
  };
}

let boundActions;
let store;

async function setupDebugger() {
  const sourceInfos = [];
  await ThreadFront.findSources(({ sourceId, url, sourceMapURL }) =>
    sourceInfos.push({
      type: "generated",
      data: prepareSourcePayload({
        actor: sourceId,
        url,
        sourceMapURL,
      }),
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
}

export function onConnect() {
  return { store, actions: boundActions, selectors, client: clientCommands };
}
