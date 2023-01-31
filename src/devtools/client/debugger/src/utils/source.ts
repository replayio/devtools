/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import { getUnicodeUrl } from "devtools/client/shared/unicode-url";
import { truncate as truncateText } from "replay-next/src/utils/text";
import { MiniSource } from "ui/reducers/sources";

import { getURL } from "./sources-tree/getURL";
import { parse as parseURL } from "./url";

export { isMinified } from "./isMinified";

export const sourceTypes = {
  coffee: "coffeescript",
  js: "javascript",
  jsx: "react",
  ts: "typescript",
  tsx: "typescript",
  vue: "vue",
};

type UrlResult = ReturnType<typeof getURL>;

const IGNORED_URLS = ["debugger eval code", "XStringBundle"];

function getPath(source: MiniSource) {
  const { path } = getURL(source);
  let lastIndex = path.lastIndexOf("/");
  let nextToLastIndex = path.lastIndexOf("/", lastIndex - 1);

  const result = [];
  do {
    result.push(path.slice(nextToLastIndex + 1, lastIndex));
    lastIndex = nextToLastIndex;
    nextToLastIndex = path.lastIndexOf("/", lastIndex - 1);
  } while (lastIndex !== nextToLastIndex);

  result.push("");

  return result;
}

export function isPretty(source: MiniSource) {
  return isPrettyURL(source.url);
}

export function isPrettyURL(url?: string) {
  return url ? url.endsWith(":formatted") : false;
}

export function isBowerComponent(source: MiniSource) {
  if (!source?.url) {
    return false;
  }

  const { url } = source;
  return url.includes("bower_components");
}

export function isNodeModule(source?: MiniSource) {
  if (!source?.url) {
    return false;
  }

  const { url } = source;
  return url.includes("node_modules");
}

export function getPrettySourceURL(url?: string) {
  if (!url) {
    url = "";
  }
  return `${url}:formatted`;
}

export function getFileExtension(source: MiniSource) {
  const { path } = getURL(source);
  if (!path) {
    return "";
  }

  const lastIndex = path.lastIndexOf(".");
  return lastIndex !== -1 ? path.slice(lastIndex + 1) : "";
}

export function isNotJavaScript(source: MiniSource) {
  return ["css", "svg", "png"].includes(getFileExtension(source));
}

export function isInvalidUrl(url: UrlResult, source: MiniSource) {
  return (
    !source.url ||
    !url.group ||
    isNotJavaScript(source) ||
    // @ts-expect-error this seems like it always fails
    IGNORED_URLS.includes(url) ||
    isPretty(source)
  );
}

export function getRawSourceURL(url?: string) {
  return url && url.endsWith(":formatted") ? url.slice(0, -":formatted".length) : url;
}

function resolveFileURL(
  url: string,
  transformUrl = (initialUrl: string) => initialUrl,
  truncate = true
) {
  const rawUrl = getRawSourceURL(url || "")!;
  const name = transformUrl(rawUrl);
  if (!truncate) {
    return name;
  }
  return truncateText(name, { maxLength: 50, position: "start" });
}

export function getFormattedSourceId(id: string) {
  return `SOURCE ${id}`;
}

/**
 * Gets a readable filename from a source URL for display purposes.
 * If the source does not have a URL, the source ID will be returned instead.
 */
export function getFilename(
  source: { id: string; url?: string },
  rawSourceURL = getRawSourceURL(source.url)
) {
  const { id } = source;
  if (!rawSourceURL) {
    return getFormattedSourceId(id);
  }

  const { filename } = getURL(source);
  return getRawSourceURL(filename);
}

/**
 * Provides a middle-trunated filename
 */
export function getTruncatedFileName(source: MiniSource, querystring = "", length = 30) {
  return truncateText(`${getFilename(source)}${querystring}`, {
    maxLength: length,
    position: "middle",
  });
}

/* Gets path for files with same filename for editor tabs, breakpoints, etc.
 * Pass the source, and list of other sources
 */
export function getDisplayPath(mySource: MiniSource, sources: MiniSource[]) {
  const rawSourceURL = getRawSourceURL(mySource.url);
  const filename = getFilename(mySource, rawSourceURL);

  // Find sources that have the same filename, but different paths
  // as the original source
  const similarSources = sources.filter(source => {
    const rawSource = getRawSourceURL(source.url);
    return rawSourceURL != rawSource && filename == getFilename(source, rawSource);
  });

  if (similarSources.length == 0) {
    return undefined;
  }

  // get an array of source path directories e.g. ['a/b/c.html'] => [['b', 'a']]
  const paths = new Array(similarSources.length + 1);

  paths[0] = getPath(mySource);
  for (let i = 0; i < similarSources.length; ++i) {
    paths[i + 1] = getPath(similarSources[i]);
  }

  // create an array of similar path directories and one dis-similar directory
  // for example [`a/b/c.html`, `a1/b/c.html`] => ['b', 'a']
  // where 'b' is the similar directory and 'a' is the dis-similar directory.
  let displayPath = "";
  for (let i = 0; i < paths[0].length; i++) {
    let similar = false;
    for (let k = 1; k < paths.length; ++k) {
      if (paths[k][i] === paths[0][i]) {
        similar = true;
        break;
      }
    }

    displayPath = paths[0][i] + (i !== 0 ? "/" : "") + displayPath;

    if (!similar) {
      break;
    }
  }

  return displayPath;
}

/**
 * Gets a readable source URL for display purposes.
 * If the source does not have a URL, the source ID will be returned instead.
 */
export function getFileURL(source: MiniSource, truncate = true) {
  const { url, id } = source;
  if (!url) {
    return getFormattedSourceId(id);
  }

  return resolveFileURL(url, getUnicodeUrl, truncate);
}

export function getSourcePath(url?: UrlResult): string {
  if (!url) {
    return "";
  }

  const { path, href } = parseURL(url);
  // for URLs like "about:home" the path is null so we pass the full href
  return path || href;
}

export function getSourceClassnames(source?: MiniSource) {
  // Conditionals should be ordered by priority of icon!
  const defaultClassName = "file";

  if (!source || !source.url) {
    return defaultClassName;
  }

  if (isPretty(source)) {
    return "prettyPrint";
  }

  return sourceTypes[getFileExtension(source) as keyof typeof sourceTypes] || defaultClassName;
}

export function getRelativeUrl(source: MiniSource, root: string) {
  const { group, path } = getURL(source);
  if (!root) {
    return path;
  }

  // + 1 removes the leading "/"
  const url = group + path;
  return url.slice(url.indexOf(root) + root.length + 1);
}

export function underRoot(source: MiniSource, root: string) {
  if (source.url && source.url.includes("chrome://")) {
    const { group, path } = getURL(source);
    return (group + path).includes(root);
  }

  return source.url && source.url.includes(root);
}

export function getSourceQueryString(source?: MiniSource) {
  if (!source) {
    return;
  }

  return parseURL(getRawSourceURL(source.url)).search;
}

export function getPlainUrl(url: string) {
  const queryStart = url.indexOf("?");
  return queryStart !== -1 ? url.slice(0, queryStart) : url;
}
