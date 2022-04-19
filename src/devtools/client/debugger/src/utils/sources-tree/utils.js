/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { parse } from "../../utils/url";
import { isPretty } from "../source";

import { getURL } from "./getURL";
const IGNORED_URLS = ["debugger eval code", "XStringBundle"];

export function nodeHasChildren(item) {
  return item.type == "directory" && Array.isArray(item.contents);
}

export function isExactUrlMatch(pathPart, debuggeeUrl) {
  // compare to hostname with an optional 'www.' prefix
  const { host } = parse(debuggeeUrl);
  if (!host) {
    return false;
  }
  return host === pathPart || host.replace(/^www\./, "") === pathPart.replace(/^www\./, "");
}

export function isPathDirectory(path) {
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

export function isDirectory(item) {
  return (item.type === "directory" || isPathDirectory(item.path)) && item.name != "(index)";
}

export function getSourceFromNode(item) {
  const { contents } = item;
  if (!isDirectory(item) && !Array.isArray(contents)) {
    return contents;
  }
}

export function isSource(item) {
  return item.type === "source";
}

export function getFileExtension(source) {
  const { path } = getURL(source);
  if (!path) {
    return "";
  }

  const lastIndex = path.lastIndexOf(".");
  return lastIndex !== -1 ? path.slice(lastIndex + 1) : "";
}

export function isNotJavaScript(source) {
  return ["css", "svg", "png"].includes(getFileExtension(source));
}

export function isInvalidUrl(url, source) {
  return (
    !source.url ||
    !url.group ||
    isNotJavaScript(source) ||
    IGNORED_URLS.includes(url) ||
    isPretty(source)
  );
}

export function partIsFile(index, parts, url) {
  const isLastPart = index === parts.length - 1;
  return isLastPart && !isDirectory(url);
}

export function createDirectoryNode(name, path, contents) {
  return {
    contents,
    name,
    path,
    type: "directory",
  };
}

export function createSourceNode(name, path, contents) {
  return {
    contents,
    name,
    path,
    type: "source",
  };
}

export function createParentMap(tree) {
  const map = new WeakMap();

  function _traverse(subtree) {
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

export function getRelativePath(url) {
  const { pathname } = parse(url);
  if (!pathname) {
    return url;
  }
  const index = pathname.indexOf("/");

  return index !== -1 ? pathname.slice(index + 1) : "";
}

export function getRelativePathWithoutFile(url) {
  const path = getRelativePath(url);
  return path.slice(0, path.lastIndexOf("/"));
}

export function getPathWithoutThread(path) {
  const pathParts = path.split(/(context\d+?\/)/).splice(2);
  if (pathParts && pathParts.length > 0) {
    return pathParts.join("");
  }
  return "";
}
