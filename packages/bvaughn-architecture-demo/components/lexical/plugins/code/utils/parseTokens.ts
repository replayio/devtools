import { javascriptLanguage } from "@codemirror/lang-javascript";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { classHighlighter, highlightTree } from "@lezer/highlight";

import { Token } from "../types";
import classNameToTokenType from "./classNameToTokenType";

export default function parseTokens(textToParse: string): Token[] | null {
  const codeMirrorState = EditorState.create({
    doc: textToParse,
    extensions: [javascriptLanguage.extension],
  });

  const tree = ensureSyntaxTree(codeMirrorState, Number.MAX_SAFE_INTEGER);
  if (tree === null) {
    return null;
  }

  const tokens: Token[] = [];

  let characterIndex = 0;

  highlightTree(tree, classHighlighter, (from, to, className) => {
    if (from > characterIndex) {
      // No style applied to the token between position and from.
      // This typically indicates white space or newline characters.
      tokens.push({
        text: textToParse.slice(characterIndex, from),
        type: null,
      });
    }

    tokens.push({
      text: textToParse.slice(from, to),
      type: classNameToTokenType(className),
    });

    characterIndex = to;
  });

  if (characterIndex < textToParse.length) {
    // Anything left is plain text
    tokens.push({
      text: textToParse.slice(characterIndex),
      type: null,
    });
  }

  return tokens;
}
