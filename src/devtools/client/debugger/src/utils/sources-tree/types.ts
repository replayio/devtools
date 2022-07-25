/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// These types are copy-pasted from the Mozilla Flow types at:
// https://hg.mozilla.org/mozilla-central/file/fd9f980e368173439465e38f6257557500f45c02/devtools/client/debugger/src/types.js

// import type { Source } from "devtools/client/debugger/src/reducers/sources";
import { SourceDetails } from "ui/reducers/sources";

export type TreeNode = TreeSource | TreeDirectory;

export type TreeSource = {
  type: "source";
  name: string;
  path: string;
  contents: SourceDetails;
};

export type TreeDirectory = {
  type: "directory";
  name: string;
  path: string;
  contents: TreeNode[];
};

export type ParentMap = WeakMap<TreeNode, TreeDirectory>;

export type SourcesGroups = {
  sourcesInside: SourceDetails[];
  sourcesOuside: SourceDetails[];
};
