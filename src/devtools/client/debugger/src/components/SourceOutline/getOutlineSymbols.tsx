import { groupBy, keyBy } from "lodash";
import { features } from "ui/utils/prefs";

import { HitCount } from "../../reducers/sources";
import { SourceSymbols, ClassSymbol, FunctionSymbol } from "../../types";
import { fuzzySearch } from "../../utils/function";

function addHitCountsToFunctions(functions: FunctionSymbol[], hitCounts: HitCount[]) {
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

    return { ...functionSymbol, hits: features.codeHeatMaps ? hitCount?.hits : undefined };
  });
}

export function getOutlineSymbols(
  symbols: null | SourceSymbols,
  filter: string,
  hitCounts: HitCount[] | null
) {
  if (!symbols || symbols.loading) {
    return null;
  }
  let { classes, functions } = symbols;
  functions = hitCounts ? addHitCountsToFunctions(functions, hitCounts) : functions;
  const classNames = new Set(classes.map(s => s.name));
  const functionsByName = keyBy(functions, "name");
  const filteredFunctions = functions.filter(
    ({ name }) =>
      !!name && name !== "anonymous" && !classNames.has(name) && fuzzySearch(name, filter)
  );

  const functionsByClass = groupBy(filteredFunctions, func => func.klass || "");

  return classes.reduce((funcs: Array<ClassSymbol | FunctionSymbol>, classSymbol) => {
    const classFuncs = functionsByClass[classSymbol.name];
    if (classFuncs?.length > 0) {
      funcs.push(functionsByName[classSymbol.name] || classSymbol, ...classFuncs);
    }
    return funcs;
  }, functionsByClass[""] || []);
}
