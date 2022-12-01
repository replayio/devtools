import type { Spread } from "lexical";
import { SerializedTextNode } from "lexical";

export type SerializedCodeCompletionTextNode = Spread<
  {
    text: string;
    type: "code-completion-item";
    version: 1;
  },
  SerializedTextNode
>;

export type Match = string;
