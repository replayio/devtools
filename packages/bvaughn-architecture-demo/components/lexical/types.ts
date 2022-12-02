// Forked from Lexical internals

import { LexicalEditor } from "lexical";

export type LexicalKey = `__lexicalKey_${string}`;

export interface LexicalHTMLElement extends HTMLElement {
  [key: LexicalKey]: string;
  __lexicalEditor: LexicalEditor;
}
