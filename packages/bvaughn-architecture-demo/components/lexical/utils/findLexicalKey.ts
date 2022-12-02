import { LexicalKey } from "../types";
import findLexicalHTMLElement from "./findLexicalHTMLElement";

export default function findLexicalKey(): LexicalKey | null {
  const lexicalHTMLElement = findLexicalHTMLElement();
  if (lexicalHTMLElement !== null) {
    const key = lexicalHTMLElement.__lexicalEditor._key;

    return `__lexicalKey_${key}` as LexicalKey;
  }

  return null;
}
