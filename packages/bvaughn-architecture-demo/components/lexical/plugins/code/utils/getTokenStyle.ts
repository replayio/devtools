import { TokenType } from "bvaughn-architecture-demo/components/lexical/plugins/code/types";

export default function getTokenStyle(tokenType: TokenType): string {
  const color = TOKEN_TYPE_TO_COLOR_MAP[tokenType];
  return `color: ${color};`;
}

const TOKEN_TYPE_TO_COLOR_MAP: { [Index in TokenType]: string } = {
  comment: "#737373",
  definition: "#3172e0",
  local: "#4e4e52",
  keyword: "#de00aa",
  meta: "#737373",
  number: "#18181a",
  operator: "#4e4e52",
  propertyName: "#dd00a9",
  punctuation: "#0074e8",
  string: "#0842a4",
  string2: "#0842a4",
  typeName: "#0074e8",
  variableName: "#8d1bdc",
  variableName2: "#8d1bdc",
};
