/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import type { ParentMap, TreeDirectory, TreeNode, TreeSource } from "./types";
import { createDirectoryNode } from "./utils";

/**
 * Take an existing source tree, find directories where
 * there is a sequence of singly-nested folders with no
 * additional files, and replace them with a single directory
 * entry whose name is those folders combined, like "/c/d/e/".
 * This mimics the common convention in IDEs and Github tree
 * displays where folder entries are collapsed together.
 *
 * Example: for a URL like `https://something.com/src/app/3/3a/3aa/g.ts`, with no other files in that path, the resulting tree
 * structure would look like:
 * ```ts
 * {
 *   type: "directory",
 *   name: "root",
 *   path: "",
 *   contents: {
 *     type: "directory",
 *     path: "/something.com",
 *     name: "something.com",
 *     contents: [
 *       type: "directory",
 *       path: "/something.com/src",
 *       name: "src",
 *       contents: [
 *         {
 *           type: "directory",
 *           path: "/something.com/rsc/app/3/3a/3aa",
 *           // Collapsed folder name here
 *           name: "app/3/3a/3aa",
 *           contents: [theSourceFile]
 *         }
 *       ]
 *     ]
 *   }
 * }
 * ```
 */
function _collapseTree(node: TreeNode, depth: number): TreeNode {
  // Node is a folder.
  if (node.type === "directory") {
    if (!Array.isArray(node.contents)) {
      console.log(`Expected array at: ${node.path}`);
    }

    // Node is not a (1) thread and (2) root/domain node,
    // and only contains 1 item.
    if (depth > 2 && node.contents.length === 1) {
      const next = node.contents[0];
      // Do not collapse if the next node is a leaf node.
      if (next.type === "directory") {
        if (!Array.isArray(next.contents)) {
          console.log(
            `Expected array at: ${next.name} -- ${node.name} -- ${JSON.stringify(next.contents)}`
          );
        }
        const name = `${node.name}/${next.name}`;
        const nextNode = createDirectoryNode(name, next.path, next.contents);
        return _collapseTree(nextNode, depth + 1);
      }
    }

    // Map the contents.
    return createDirectoryNode(
      node.name,
      node.path,
      node.contents.map(next => _collapseTree(next, depth + 1))
    );
  }

  // Node is a leaf, not a folder, do not modify it.
  return node;
}

export function collapseTree(node: TreeNode) {
  const tree = _collapseTree(node, 0);
  return tree;
}
