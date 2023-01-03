import { TokenType } from "bvaughn-architecture-demo/components/lexical/plugins/code/types";

export default function getTokenStyle(tokenType: TokenType): string {
  const color = TOKEN_TYPE_TO_COLOR_MAP[tokenType];
  return `color: ${color};`;
}

const TOKEN_TYPE_TO_COLOR_MAP: { [Index in TokenType]: string } = {
  comment: "var(--token-comment-color)",
  definition: "var(--token-definition-color)",
  local: "var(--token-local-color)",
  keyword: "var(--token-keyword-color)",
  meta: "var(--token-meta-color)",
  number: "var(--token-number-color)",
  operator: "var(--token-operator-color)",
  propertyName: "var(--token-propertyName-color)",
  punctuation: "var(--token-punctuation-color)",
  string: "var(--token-string-color)",
  string2: "var(--token-string2-color)",
  typeName: "var(--token-typeName-color)",
  variableName: "var(--token-variableName-color)",
  variableName2: "var(--token-variableName2-color)",
};
