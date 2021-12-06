import { fuzzySearch } from "../../utils/function";
import { groupBy, keyBy } from "lodash";
import { SourceSymbols, ClassSymbol, FunctionSymbol } from "../../types";

export function getOutlineSymbols(symbols: null | SourceSymbols, filter: string) {
  if (!symbols || symbols.loading) {
    return null;
  }
  const { classes, functions } = symbols;
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
