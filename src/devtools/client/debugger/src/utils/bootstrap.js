/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import * as search from "../workers/search";
import { ParserDispatcher } from "../workers/parser";

export let parser;

export function bootstrapWorkers(panelWorkers) {
  parser = new ParserDispatcher();

  parser.start(() => new Worker(new URL("../workers/parser/worker", import.meta.url)), "parser");
  search.start(() => new Worker(new URL("../workers/search/worker", import.meta.url)), "search");
}

export function teardownWorkers() {
  parser.stop();
  search.stop();
}
