import type { SerializedElementNode, Spread } from "lexical";

export type SerializedCodeNode = Spread<
  {
    type: "code";
    version: 1;
  },
  SerializedElementNode
>;

export type TokenType =
  | "comment"
  | "definition"
  | "local"
  | "meta"
  | "keyword"
  | "number"
  | "operator"
  | "propertyName"
  | "punctuation"
  | "string"
  | "string2"
  | "typeName"
  | "variableName"
  | "variableName2";

export type Token = {
  text: string;
  types: TokenType[] | null;
};
