/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { parse } from "../url";

import type { TreeNode, TreeSource, TreeDirectory, ParentMap } from "./types";
import { SourceDetails } from "ui/reducers/sources";

// Additional TS types ported from Mozilla Flow types:
// https://hg.mozilla.org/mozilla-central/file/fd9f980e368173439465e38f6257557500f45c02/devtools/client/debugger/src/utils/sources-tree
export type SourcesMap = Record<string, SourceDetails>;

export function nodeHasChildren(item: TreeNode) {
  return item.type == "directory" && Array.isArray(item.contents);
}

export function isExactUrlMatch(pathPart: string, debuggeeUrl: string) {
  // compare to hostname with an optional 'www.' prefix
  const { host } = parse(debuggeeUrl);
  if (!host) {
    return false;
  }
  return host === pathPart || host.replace(/^www\./, "") === pathPart.replace(/^www\./, "");
}

export function isPathDirectory(path: string) {
  // Assume that all urls point to files except when they end with '/'
  // Or directory node has children

  if (path.endsWith("/")) {
    return true;
  }

  let separators = 0;
  for (let i = 0; i < path.length - 1; ++i) {
    if (path[i] === "/") {
      if (path[i + i] !== "/") {
        return false;
      }

      ++separators;
    }
  }

  switch (separators) {
    case 0: {
      return false;
    }
    case 1: {
      return !path.startsWith("/");
    }
    default: {
      return true;
    }
  }
}

export function isDirectory(item: TreeNode) {
  return (item.type === "directory" || isPathDirectory(item.path)) && item.name != "(index)";
}

export function getSourceFromNode(item: TreeNode) {
  const { contents } = item;
  if (!isDirectory(item) && !Array.isArray(contents)) {
    return contents;
  }
}

export function isSource(item: TreeNode) {
  return item.type === "source";
}

export function partIsFile(index: number, parts: string[], url: TreeNode) {
  const isLastPart = index === parts.length - 1;
  return isLastPart && !isDirectory(url);
}

export function createDirectoryNode(
  name: string,
  path: string,
  contents: TreeNode[]
): TreeDirectory {
  return {
    type: "directory",
    name,
    path,
    contents,
  };
}

export function createSourceNode(name: string, path: string, contents: SourceDetails): TreeSource {
  return {
    type: "source",
    name,
    path,
    contents,
  };
}

export function createParentMap(tree: TreeNode) {
  const map = new WeakMap();

  function _traverse(subtree: TreeNode) {
    if (subtree.type === "directory") {
      for (const child of subtree.contents) {
        map.set(child, subtree);
        _traverse(child);
      }
    }
  }

  if (tree.type === "directory") {
    // Don't link each top-level path to the "root" node because the
    // user never sees the root
    tree.contents.forEach(_traverse);
  }

  return map;
}

export function getRelativePath(url: string) {
  const { pathname } = parse(url);
  if (!pathname) {
    return url;
  }
  const index = pathname.indexOf("/");

  return index !== -1 ? pathname.slice(index + 1) : "";
}

export function getRelativePathWithoutFile(url: string) {
  const path = getRelativePath(url);
  return path.slice(0, path.lastIndexOf("/"));
}

export function getPathWithoutThread(path: string) {
  const pathParts = path.split(/(context\d+?\/)/).splice(2);
  if (pathParts && pathParts.length > 0) {
    return pathParts.join("");
  }
  return "";
}
