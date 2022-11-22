/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { SourceDetails } from "ui/reducers/sources";

import { addToTree } from "./addToTree";
import { collapseTree } from "./collapseTree";
import type { TreeDirectory, TreeNode } from "./types";
import { createDirectoryNode, createParentMap } from "./utils";

type SourcesMap = Record<string, SourceDetails>;

function getSourcesToAdd(newSources: SourcesMap, prevSources: SourcesMap) {
  const sourcesToAdd = [];

  for (const sourceId in newSources) {
    const newSource = newSources[sourceId];
    const prevSource = prevSources ? prevSources[sourceId] : null;
    if (!prevSource) {
      sourcesToAdd.push(newSource);
    }
  }

  return sourcesToAdd;
}

export function createTree({ sources }: { sources: SourcesMap }) {
  // This used to be used, but it's not anymore.
  const uncollapsedTree = createDirectoryNode("root", "", []);

  return updateTree({
    debuggeeUrl: "",
    newSources: sources,
    prevSources: {},
    uncollapsedTree,
  });
}

interface UpdateTreeArgs {
  /**The new sources to show, in a record keyed by source URL */
  newSources: SourcesMap;
  /**The previous sources to show, in a record keyed by source URL */
  prevSources: SourcesMap;
  /** The previously constructed full tree, with no folder entries "collapsed" together */
  uncollapsedTree: TreeDirectory;
  /** @deprecated Now-unused string to compare hostnames */
  debuggeeUrl: string;
  /** The final display copy of the tree, with any sets of singly-nested folders "collapsed" together */
  sourceTree?: TreeNode;
}

export function updateTree({ newSources, prevSources, uncollapsedTree }: UpdateTreeArgs) {
  const debuggeeHost = "";

  // @ts-expect-error This used to be nested records - somehow it still works?
  const sourcesToAdd = getSourcesToAdd(Object.values(newSources), Object.values(prevSources));

  for (const source of sourcesToAdd) {
    addToTree(uncollapsedTree, source, debuggeeHost!);
  }

  const newSourceTree = collapseTree(uncollapsedTree);

  return {
    uncollapsedTree,
    sourceTree: newSourceTree,
    parentMap: createParentMap(newSourceTree),
  };
}
