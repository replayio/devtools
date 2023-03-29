import { ClassDeclaration, FunctionDeclaration } from "../../reducers/ast";

export function isFunctionDeclaration(
  symbol: FunctionDeclaration | ClassDeclaration
): symbol is FunctionDeclaration {
  return "parameterNames" in symbol;
}
