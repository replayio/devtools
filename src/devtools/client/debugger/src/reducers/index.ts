/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

/**
 * Reducer index
 * @module reducers/index
 */

import breakpoints from "./breakpoints";
import pendingBreakpoints from "./pending-breakpoints";
import asyncRequests from "./async-requests";
import pause from "./pause";
import ui from "./ui";
import fileSearch from "./file-search";
import ast from "./ast";
import preview from "./preview";
import quickOpen from "./quick-open";
import sourceTree from "./source-tree";
import threads from "./threads";

export default {
  breakpoints,
  pendingBreakpoints,
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
