/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { addToTree } from "./addToTree";
import { collapseTree } from "./collapseTree";
import { createDirectoryNode, createParentMap } from "./utils";
import { getDomain } from "./treeOrder";

import type { Source } from "../../reducers/sources";
import type { TreeNode, TreeSource, TreeDirectory, ParentMap } from "./types";
import type { ParsedUrl } from "./getURL";

type SourcesMap = Record<string, Source>;

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

export function createTree({ debuggeeUrl, sources }: { debuggeeUrl: string; sources: SourcesMap }) {
  const uncollapsedTree = createDirectoryNode("root", "", []);

  return updateTree({
    debuggeeUrl,
    newSources: sources,
    prevSources: {},
    uncollapsedTree,
  });
}

interface UpdateTreeArgs {
  newSources: SourcesMap;
  prevSources: SourcesMap;
  uncollapsedTree: TreeDirectory;
  debuggeeUrl: string;
  sourceTree?: TreeNode;
}

export function updateTree({
  newSources,
  prevSources,
  debuggeeUrl,
  uncollapsedTree,
}: UpdateTreeArgs) {
  const debuggeeHost = getDomain(debuggeeUrl);

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
