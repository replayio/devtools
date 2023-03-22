import {
  ClassOutline,
  FunctionOutline,
  SourceLocationRange,
  getSourceOutlineResult,
} from "@replayio/protocol";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";

import { LineNumberToHitCountMap } from "shared/client/types";

import { fuzzySearch } from "../../utils/function";

export type FunctionDeclarationHits = FunctionOutline & {
  hits?: number;
};

export type HitCount = number;

function getClosestHitCount(
  hitCountsMap: LineNumberToHitCountMap,
  location: SourceLocationRange
): HitCount | null {
  const { line: endLine } = location.end;
  const { line: startLine } = location.begin;
  for (let line = startLine; line <= endLine; line++) {
    let hitCounts = hitCountsMap.get(line);
    if (hitCounts) {
      if (line === startLine || line === endLine) {
        return hitCounts.count;
      }
    }
  }

  return null;
}

function addHitCountsToFunctions(
  functions: FunctionOutline[],
  hitCountsMap: LineNumberToHitCountMap | null
): FunctionDeclarationHits[] {
  if (!hitCountsMap) {
    return functions;
  }

  return functions.map(functionSymbol => {
    const count = getClosestHitCount(hitCountsMap, functionSymbol.location);
    return Object.assign({}, functionSymbol, { hits: count || 0 });
  });
}

export function getOutlineSymbols(
  symbols: null | getSourceOutlineResult,
  filter: string,
  hitCounts: LineNumberToHitCountMap | null
) {
  if (!symbols) {
    return null;
  }

  let { classes, functions } = symbols;
  functions = addHitCountsToFunctions(functions, hitCounts);
  const classNames = new Set(classes.map(s => s.name));
  const functionsByName = keyBy(functions, "name");
  const filteredFunctions = functions.filter(
    ({ name }) =>
      !!name && name !== "anonymous" && !classNames.has(name) && fuzzySearch(name, filter)
  );

  const functionsByClass = groupBy(filteredFunctions, func => func.className || "");

  return classes.reduce((funcs: Array<ClassOutline | FunctionOutline>, classSymbol) => {
    if (classSymbol.name) {
      const classFuncs = functionsByClass[classSymbol.name];
      if (classFuncs?.length > 0) {
        funcs.push(functionsByName[classSymbol.name] || classSymbol, ...classFuncs);
      }
    }
    return funcs;
  }, functionsByClass[""] || []);
}
