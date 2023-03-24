import { ClassOutline, FunctionOutline } from "@replayio/protocol";

export function isFunctionOutline(
  symbol: FunctionOutline | ClassOutline
): symbol is FunctionOutline {
  return "parameters" in symbol;
}
