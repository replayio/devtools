import type { Location, SourceId } from "@replayio/protocol";
import { LineNumberToHitCountMap } from "bvaughn-architecture-demo/src/suspense/SourcesCache";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import { ColumnHits } from "shared/client/types";
import { LoadingStatus } from "ui/utils/LoadingStatus";

import {
  FunctionDeclaration,
  ClassDeclaration,
  SymbolEntry,
  AstLocation,
} from "../../reducers/ast";
import { fuzzySearch } from "../../utils/function";

export type FunctionDeclarationHits = FunctionDeclaration & {
  hits?: number;
};

export type HitCount = ColumnHits;

function getClosestHitCount(
  hitCountsMap: LineNumberToHitCountMap,
  location: AstLocation
): HitCount | null {
  const { column: endColumn, line: endLine } = location.end;
  const { column: startColumn, line: startLine } = location.start;
  for (let line = startLine; line <= endLine; line++) {
    let hitCounts = hitCountsMap.get(line);
    if (hitCounts) {
      if (line === startLine || line === endLine) {
        const filteredColumnHits = hitCounts.filter(columnHit => {
          return (
            line > startLine ||
            (columnHit.location.column >= startColumn && line < endLine) ||
            columnHit.location.column <= endColumn
          );
        });
        if (filteredColumnHits.length > 0) {
          return filteredColumnHits[0];
        }
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
    const hitCount = getClosestHitCount(hitCountsMap, functionSymbol.location);
    return Object.assign({}, functionSymbol, { hits: hitCount?.hits || 0 });
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
