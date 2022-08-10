import type { Location } from "@replayio/protocol";
import { fuzzySearch } from "../../utils/function";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import {
  FunctionDeclaration,
  ClassDeclaration,
  SymbolEntry,
  AstLocation,
} from "../../reducers/ast";
import { LoadingStatus } from "ui/utils/LoadingStatus";
import { HitCountsByLine } from "ui/reducers/hitCounts";

export type FunctionDeclarationHits = FunctionDeclaration & {
  hits?: number;
};

export interface HitCount {
  location: Location;
  hits: number;
}

function getClosestHitCount(
  hitCountsByLine: HitCountsByLine,
  location: AstLocation
): HitCount | undefined {
  const { start, end } = location;
  const multiline = end.line > start.line;
  if (multiline) {
    for (let line = start.line; line <= end.line; line++) {
      const hitCount = hitCountsByLine[line]?.[0];
      if (hitCount) {
        return hitCount;
      }
    }
  } else {
    const hitCounts = hitCountsByLine[start.line];
    const hitCount = hitCounts?.find(hitCount => hitCount.location.column! >= start.column);
    return hitCount;
  }
}

function addHitCountsToFunctions(
  functions: FunctionDeclaration[],
  hitCountsByLine: HitCountsByLine | null
): FunctionDeclarationHits[] {
  if (!hitCountsByLine) {
    return functions;
  }

  return functions.map(functionSymbol => {
    const hitCount = getClosestHitCount(hitCountsByLine, functionSymbol.location);
    return { ...functionSymbol, hits: hitCount?.hits };
  });
}

export function getOutlineSymbols(
  symbolsEntry: null | SymbolEntry,
  filter: string,
  hitCounts: HitCountsByLine | null
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
