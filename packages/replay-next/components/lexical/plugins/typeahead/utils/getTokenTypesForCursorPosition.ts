import { LexicalNode } from "lexical";

import parseTokens from "../../code/utils/parseTokens";
import getLineTextAndCursorPosition from "./getLineTextAndCursorPosition";

export default function getTokenTypesForCursorPosition(
  initialNode: LexicalNode,
  initialOffset: number
): string[] | null {
  const [text, cursorIndex] = getLineTextAndCursorPosition(initialNode, initialOffset);
  if (text === null) {
    return null;
  }

  const tokens = parseTokens(text);
  if (tokens === null) {
    return null;
  }

  let currentIndex = 0;
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    const token = tokens[tokenIndex];

    currentIndex += token.text.length;

    if (currentIndex >= cursorIndex) {
      return token.types;
    }
  }

  return null;
}
