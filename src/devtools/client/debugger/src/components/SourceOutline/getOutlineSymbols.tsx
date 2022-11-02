import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";

import { LineNumberToHitCountMap } from "shared/client/types";
import { LoadingStatus } from "ui/utils/LoadingStatus";

import {
  AstLocation,
  ClassDeclaration,
  FunctionDeclaration,
  SymbolEntry,
} from "../../reducers/ast";
import { fuzzySearch } from "../../utils/function";

export type FunctionDeclarationHits = FunctionDeclaration & {
  hits?: number;
};

export type HitCount = number;

function getClosestHitCount(
  hitCountsMap: LineNumberToHitCountMap,
  location: AstLocation
): HitCount | null {
  const { line: endLine } = location.end;
  const { line: startLine } = location.start;
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
  functions: FunctionDeclaration[],
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
  symbolsEntry: null | SymbolEntry,
  filter: string,
  hitCounts: LineNumberToHitCountMap | null
) {
  if (!symbolsEntry || symbolsEntry.status !== LoadingStatus.LOADED) {
    return null;
  }

  let { classes, functions } = symbolsEntry.symbols!;
  functions = addHitCountsToFunctions(functions, hitCounts);
  const classNames = new Set(classes.map(s => s.name));
  const functionsByName = keyBy(functions, "name");
  const filteredFunctions = functions.filter(
    ({ name }) =>
      !!name && name !== "anonymous" && !classNames.has(name) && fuzzySearch(name, filter)
  );

  const functionsByClass = groupBy(filteredFunctions, func => func.klass || "");

  return classes.reduce((funcs: Array<ClassDeclaration | FunctionDeclaration>, classSymbol) => {
    const classFuncs = functionsByClass[classSymbol.name];
    if (classFuncs?.length > 0) {
      funcs.push(functionsByName[classSymbol.name] || classSymbol, ...classFuncs);
    }
    return funcs;
  }, functionsByClass[""] || []);
}
