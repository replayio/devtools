/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import * as search from "../workers/search";
import { ParserDispatcher } from "../workers/parser";

import * as selectors from "../selectors";
import { asyncStore } from "./prefs";
import { persistTabs } from "../utils/tabs";

export let parser;

export function bootstrapWorkers(panelWorkers) {
  parser = new ParserDispatcher();

  parser.start(() => new Worker(new URL("../workers/parser/worker", import.meta.url)), "parser");
  search.start(() => new Worker(new URL("../workers/search/worker", import.meta.url)), "search");
  return { ...panelWorkers, parser, search };
}

export function teardownWorkers() {
  parser.stop();
  search.stop();
}

let currentPendingBreakpoints;
let currentTabs;

export function updatePrefs(state) {
  const previousPendingBreakpoints = currentPendingBreakpoints;
  const previousTabs = currentTabs;
  currentPendingBreakpoints = selectors.getPendingBreakpoints(state);
  currentTabs = selectors.getTabs(state);

  if (previousPendingBreakpoints && currentPendingBreakpoints !== previousPendingBreakpoints) {
    asyncStore.pendingBreakpoints = currentPendingBreakpoints;
  }

  if (previousTabs && previousTabs !== currentTabs) {
    asyncStore.tabs = persistTabs(currentTabs);
  }
}
