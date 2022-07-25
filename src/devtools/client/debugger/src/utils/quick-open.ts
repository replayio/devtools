/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import type { FunctionMatch } from "@replayio/protocol";

import { endTruncateStr } from "./utils";
import { memoizeLast } from "./memoizeLast";
import { getTruncatedFileName, getSourceClassnames, getSourceQueryString } from "./source";

import { SourceDetails, isPrettyPrintedSource } from "ui/reducers/sources";
import { SymbolDeclarations, FunctionDeclaration } from "../reducers/ast";
import { Dictionary } from "@reduxjs/toolkit";
import { SearchTypes } from "../reducers/quick-open";

export const MODIFIERS: Record<string, SearchTypes> = {
  "@": "functions",
  "#": "variables",
  ":": "goto",
  "?": "shortcuts",
};

export function parseQuickOpenQuery(query: string): SearchTypes {
  const startsWithModifier =
    query[0] === "@" || query[0] === "#" || query[0] === ":" || query[0] === "?";

  if (startsWithModifier) {
    const modifier = query[0] as keyof typeof MODIFIERS;
    return MODIFIERS[modifier];
  }

  const isGotoSource = query.includes(":", 1);

  if (isGotoSource) {
    return "gotoSource";
  }

  return "sources";
}

export function parseLineColumn(query: string) {
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

export function formatSourcesForList(source: SourceDetails, tabUrls: Set<string>) {
  const title = getTruncatedFileName(source);
  const relativeUrlWithQuery = `${source.url}${getSourceQueryString(source) || ""}`;
  const subtitle = endTruncateStr(relativeUrlWithQuery, 100);
  const value = relativeUrlWithQuery;
  return {
    value,
    title,
    subtitle,
    icon: tabUrls.has(source.url!)
      ? "tab result-item-icon"
      : `result-item-icon ${getSourceClassnames(source)}`,
    id: source.id,
    url: source.url,
  };
}

export function formatSymbol(symbol: FunctionDeclaration) {
  return {
    id: `${symbol.name}:${symbol.location.start.line}`,
    title: symbol.name,
    subtitle: `${symbol.location.start.line}`,
    value: symbol.name,
    location: symbol.location,
  };
}

export function formatProjectFunctions(
  functions: FunctionMatch[],
  displayedSources: Dictionary<SourceDetails>
) {
  const sourceFunctions = functions
    .map(({ name, loc }) => {
      const source = displayedSources[loc.sourceId];
      if (!source?.url) {
        return [];
      }

      return {
        id: `${name}:${loc.line}:${loc.column}`,
        title: name,
        subtitle: loc.line,
        secondaryTitle: getTruncatedFileName(source),
        value: name,
        location: { start: loc },
      };
    })
    .flat()
    .filter(i => i);

  return sourceFunctions;
}

export const formatSymbols = memoizeLast((symbols: SymbolDeclarations | null) => {
  if (!symbols?.functions || symbols.loading) {
    return { functions: [] };
  }

  return {
    functions: symbols.functions.map(formatSymbol),
  };
});

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

export function formatSources(
  sources: SourceDetails[],
  sourcesById: Record<string, SourceDetails>,
  tabUrls: Set<string>
) {
  const formattedSources = [];
  const sourceURLs = new Set();

  for (let i = 0; i < sources.length; ++i) {
    const source = sources[i];

    if (!source.url || source.url.includes("webpack-internal") || source.url.includes(".css")) {
      continue;
    }

    if (!!source.url && !isPrettyPrintedSource(source) && !sourceURLs.has(source.url)) {
      const canonicalSource = sourcesById[source.canonicalId];

      const sourceToShow = canonicalSource ?? source;

      formattedSources.push(formatSourcesForList(sourceToShow, tabUrls));
      sourceURLs.add(sourceToShow.url);
    }
  }

  return formattedSources;
}
