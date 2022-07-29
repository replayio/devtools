import type { Location } from "@replayio/protocol";
import { fuzzySearch } from "../../utils/function";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import { FunctionDeclaration, ClassDeclaration, SymbolEntry } from "../../reducers/ast";
import { LoadingStatus } from "ui/utils/LoadingStatus";

export type FunctionDeclarationHits = FunctionDeclaration & {
  hits?: number;
};

export interface HitCount {
  location: Location;
  hits: number;
}

function addHitCountsToFunctions(
  functions: FunctionDeclaration[],
  hitCounts: HitCount[] | null
): FunctionDeclarationHits[] {
  if (!hitCounts) {
    return functions;
  }

  return functions.map(functionSymbol => {
    const { start, end } = functionSymbol.location;

    const multiline = end.line > start.line;

    const hitCount = hitCounts?.find(hitCount => {
      if (multiline) {
        // for multi-line functions, we return the first hit count after the declaration
        return hitCount.location.line > start.line && hitCount.location.line <= end.line;
      }
      // for single-line functions, we return the first hit count after the start column
      return hitCount.location.line === end.line && hitCount.location.column! >= start.column;
    });

    return { ...functionSymbol, hits: hitCount?.hits };
  });
}

export function getOutlineSymbols(
  symbolsEntry: null | SymbolEntry,
  filter: string,
  hitCounts: HitCount[] | null
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
