import { LexicalHTMLElement } from "../types";

export default function findLexicalHTMLElement(): LexicalHTMLElement | null {
  return document.querySelector("[data-lexical-editor]");
}
