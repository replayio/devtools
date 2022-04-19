/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import {
  isPretty,
  getTruncatedFileName,
  getSourceClassnames,
  getSourceQueryString,
} from "./source";
import { endTruncateStr } from "./utils";

export const MODIFIERS = {
  "#": "variables",
  ":": "goto",
  "?": "shortcuts",
  "@": "functions",
};

export function parseQuickOpenQuery(query) {
  const startsWithModifier =
    query[0] === "@" || query[0] === "#" || query[0] === ":" || query[0] === "?";

  if (startsWithModifier) {
    const modifier = query[0];
    return MODIFIERS[modifier];
  }

  const isGotoSource = query.includes(":", 1);

  if (isGotoSource) {
    return "gotoSource";
  }

  return "sources";
}

export function parseLineColumn(query) {
  const [, line, column] = query.split(":");
  const lineNumber = parseInt(line, 10);
  const columnNumber = parseInt(column, 10);
  if (!isNaN(lineNumber)) {
    return {
      line: lineNumber,
      ...(!isNaN(columnNumber) ? { column: columnNumber } : null),
    };
  }
}

export function formatSourcesForList(source, tabUrls) {
  const title = getTruncatedFileName(source);
  const relativeUrlWithQuery = `${source.relativeUrl}${getSourceQueryString(source) || ""}`;
  const subtitle = endTruncateStr(relativeUrlWithQuery, 100);
  const value = relativeUrlWithQuery;
  return {
    icon: tabUrls.has(source.url)
      ? "tab result-item-icon"
      : `result-item-icon ${getSourceClassnames(source)}`,
    id: source.id,
    subtitle,
    title,
    url: source.url,
    value,
  };
}

export function formatSymbol(symbol) {
  return {
    id: `${symbol.name}:${symbol.location.start.line}`,
    location: symbol.location,
    subtitle: `${symbol.location.start.line}`,
    title: symbol.name,
    value: symbol.name,
  };
}

export function formatProjectFunctions(functions, displayedSources) {
  const sourceFunctions = functions
    .map(({ name, loc }) => {
      const source = displayedSources[loc.sourceId];
      if (!source?.url) {
        return [];
      }

      return {
        id: `${name}:${loc.line}:${loc.column}`,
        location: { start: loc },
        secondaryTitle: getTruncatedFileName(source),
        subtitle: loc.line,
        title: name,
        value: name,
      };
    })
    .flat()
    .filter(i => i);

  return sourceFunctions;
}

export function formatSymbols(symbols) {
  if (!symbols?.functions || symbols.loading) {
    return { functions: [] };
  }

  return {
    functions: symbols.functions.map(formatSymbol),
  };
}

export function formatShortcutResults() {
  return [
    {
      value: "Search for a function in a file",
      title: `@ ${"Search functions…"}`,
      id: "@",
    },
    {
      value: "Search for a variable in a file",
      title: `# ${"Search variables…"}`,
      id: "#",
    },
    {
      value: "Go to a line number in a file",
      title: `: ${"Go to line…"}`,
      id: ":",
    },
  ];
}

export function formatSources(sources, tabUrls) {
  const formattedSources = [];
  const sourceURLs = new Set();

  for (let i = 0; i < sources.length; ++i) {
    const source = sources[i];

    if (!source.url || source.url.includes("webpack-internal") || source.url.includes(".css")) {
      continue;
    }

    if (!!source.relativeUrl && !isPretty(source) && !sourceURLs.has(source.url)) {
      formattedSources.push(formatSourcesForList(source, tabUrls));
      sourceURLs.add(source.url);
    }
  }

  return formattedSources;
}
