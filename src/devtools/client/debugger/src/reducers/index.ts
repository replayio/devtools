/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Reducer index
 * @module reducers/index
 */

import ast from "./ast";
import asyncRequests from "./async-requests";
import fileSearch from "./file-search";
import pause from "./pause";
import preview from "./preview";
import quickOpen from "./quick-open";
import sourceTree from "./source-tree";
import threads from "./threads";
import ui from "./ui";

export default {
  asyncRequests,
  pause,
  ui,
  fileSearch,
  ast,
  quickOpen,
  sourceTree,
  threads,
  preview,
};
