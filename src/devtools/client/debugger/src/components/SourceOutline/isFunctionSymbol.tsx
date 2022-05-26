import { FunctionSymbol, ClassSymbol } from "../../types";

export function isFunctionSymbol(symbol: FunctionSymbol | ClassSymbol): symbol is FunctionSymbol {
  return "parameterNames" in symbol;
}
