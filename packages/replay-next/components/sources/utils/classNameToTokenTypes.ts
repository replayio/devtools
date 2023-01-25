import { TokenType } from "../../lexical/plugins/code/types";

export default function classNameToTokenTypes(className: string): TokenType[] {
  // e.g. "tok-comment" -> ["comment"]
  // e.g. "tok-variable tok-definition" -> ["variable", "definition"]
  return className.split(" ").map(name => name.slice(4) as TokenType);
}
