/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import * as fileSearch from "./file-search";
import * as pause from "./pause";
import * as preview from "./preview";
import * as quickOpen from "./quick-open";
import * as sourceTree from "./source-tree";
import * as sources from "./sources";
import * as tabs from "./tabs";
import * as ui from "./ui";

export default {
  ...sources,
  ...tabs,
  ...pause,
  ...ui,
  ...fileSearch,
  ...quickOpen,
  ...sourceTree,
  ...preview,
};
