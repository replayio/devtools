import { ClassOutline, FunctionOutline, getSourceOutlineResult } from "@replayio/protocol";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";

import { fuzzySearch } from "../../utils/function";

export type FunctionDeclarationHits = FunctionOutline & {
  hits?: number;
};

export type HitCount = number;

export function getOutlineSymbols(symbols: null | getSourceOutlineResult, filter: string) {
  if (!symbols) {
    return null;
  }

  let { classes, functions } = symbols;
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
