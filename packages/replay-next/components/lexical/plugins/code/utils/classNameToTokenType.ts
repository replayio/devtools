import { TokenType } from "../types";

export default function classNameToTokenType(className: string): TokenType {
  // e.g. "tok-comment"
  return className.slice(4) as TokenType;
}
