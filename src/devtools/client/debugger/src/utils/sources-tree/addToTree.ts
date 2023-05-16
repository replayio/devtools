/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { SourceDetails } from "ui/reducers/sources";

import { isInvalidUrl } from "../source";
import { getURL } from "./getURL";
import type { ParsedUrl } from "./getURL";
import { createTreeNodeMatcher, findNodeInContents } from "./treeOrder";
// import type { Source } from "../../reducers/sources";
import type { ParentMap, TreeDirectory, TreeNode, TreeSource } from "./types";
import {
  createDirectoryNode,
  createSourceNode,
  isDirectory,
  isPathDirectory,
  nodeHasChildren,
  partIsFile,
} from "./utils";

function createNodeInTree(part: string, path: string, tree: TreeDirectory, index: number) {
  const node = createDirectoryNode(part, path, []);

  // we are modifying the tree
  const contents = tree.contents.slice(0);
  contents.splice(index, 0, node);
  tree.contents = contents;

  return node;
}

/*
 * Look for the child node
 * 1. if it exists return it
 * 2. if it does not exist create it
 */
function findOrCreateNode(
  parts: string[],
  subTree: TreeDirectory,
  path: string,
  part: string,
  index: number,
  url: TreeNode,
  debuggeeHost: string,
  source: SourceDetails
) {
  const addedPartIsFile = partIsFile(index, parts, url);

  const { found: childFound, index: childIndex } = findNodeInContents(
    subTree,
    createTreeNodeMatcher(part, !addedPartIsFile, debuggeeHost)
  );

  // we create and enter the new node
  if (!childFound) {
    return createNodeInTree(part, path, subTree, childIndex);
  }

  // we found a path with the same name as the part. We need to determine
  // if this is the correct child, or if we have a naming conflict
  const child = subTree.contents[childIndex];
  const childIsFile = !isDirectory(child);

  // if we have a naming conflict, we'll create a new node
  if (childIsFile != addedPartIsFile) {
    // pass true to findNodeInContents to sort node by url
    const { index: insertIndex } = findNodeInContents(
      subTree,
      createTreeNodeMatcher(part, !addedPartIsFile, debuggeeHost, source, true)
    );
    return createNodeInTree(part, path, subTree, insertIndex);
  }

  // if there is no naming conflict, we can traverse into the child
  return child;
}

/*
 * walk the source tree to the final node for a given url,
 * adding new nodes along the way
 */
function traverseTree(
  url: ParsedUrl,
  tree: TreeDirectory,
  debuggeeHost: string,
  source: SourceDetails
) {
  const parts = url.path.replace(/\/$/, "").split("/");
  parts[0] = url.group;

  let path = "";
  return parts.reduce((subTree, part, index) => {
    path = `${path}/${part}`;

    const debuggeeHostIfRoot = index === 1 ? debuggeeHost : null;

    return findOrCreateNode(
      parts,
      subTree,
      path,
      part,
      index,
      // @ts-expect-error Problem with `url` vs `TreeNode` here and in other fns?
      url,
      debuggeeHostIfRoot,
      source
    ) as TreeDirectory;
  }, tree);
}

/*
 * Add a source file to a directory node in the tree
 */
function addSourceToNode(node: TreeNode, url: ParsedUrl, source: SourceDetails) {
  const isFile = !isPathDirectory(url.path);

  if (node.type == "source" && !isFile) {
    throw new Error(`Unexpected type "source" at: ${node.name}`);
  }

  const { filename } = url;

  // if we have a file, update this TreeNode.
  if (isFile) {
    // This part gets weird.
    // The logic here is partially mutative. We may end up mutating `node` to
    // change its type depending on what it is already, and what we're adding.
    switch (node.type) {
      case "directory": {
        // This is the first source entry with this filename.
        // Intentionally convert the node into a "source" node,
        // with the `SourceDetails` as its contents.
        // @ts-expect-error this is intentional
        node.type = "source";
        return source;
      }
      case "source": {
        // We've found a potentially duplicated file with multiple versions.
        // _If_ the contents are identical, do nothing - no reason to show them separately.

        if (node.contents.contentId === source.contentId) {
          // The return value gets assigned as the _new_ `node.contents`,
          // so return the existing source entry to leave things unchanged.
          return node.contents;
        }

        // Otherwise, convert the "single-source" tree node with a `SourceDetails` as its
        // contents, into a "multiSource" node with an array of 2 "source" nodes
        // as its contents. We can hardcode the numeric prefixes for multi-versions.
        const newContents = [
          createSourceNode(`(1) ${filename}`, node.contents.url!, node.contents),
          createSourceNode(`(2) ${filename}`, source.url!, source),
        ];

        // @ts-expect-error this is intentional
        node.type = "multiSource";
        return newContents;
      }
      case "multiSource": {
        // We might also have an existing entry for this content hash here.
        // Similar to the single case, skip adding the new one if there's a collision.
        if (node.contents.find(childNode => childNode.contents.contentId === source.contentId)) {
          return node.contents;
        }

        const newContents = node.contents.concat(createSourceNode(filename, source.url!, source));

        // Recalculate the numeric prefixes for each version of the file.
        newContents.forEach((node, i) => {
          node.name = `(${i + 1}) ${filename}`;
        });
        return newContents;
      }
    }
  }

  // If it's not a file, it might be an "(index)" entry or similar.

  if (Array.isArray(node.contents)) {
    const { found: childFound, index: childIndex } = findNodeInContents(
      node,
      createTreeNodeMatcher(filename, false, undefined)
    );

    // if we are readding an existing file in the node, overwrite the existing
    // file and return the node's contents
    if (childFound) {
      const existingNode = node.contents[childIndex];
      if (existingNode.type === "source") {
        existingNode.contents = source;
      }

      return node.contents;
    }

    // if this is a new file, add the new file;
    const newNode = createSourceNode(filename, source.url!, source);
    const contents = node.contents.slice(0);
    contents.splice(childIndex, 0, newNode);
    return contents;
  }
}

/**
 * @memberof utils/sources-tree
 * @static
 */
export function addToTree(tree: TreeDirectory, source: SourceDetails, debuggeeHost?: string) {
  const url = getURL(source, debuggeeHost);

  if (isInvalidUrl(url, source)) {
    return;
  }

  const finalNode = traverseTree(url, tree, debuggeeHost!, source);

  // TODO This does weird mutations and changing of node types, rework this
  // @ts-expect-error intentional
  finalNode.contents = addSourceToNode(finalNode, url, source);
}
