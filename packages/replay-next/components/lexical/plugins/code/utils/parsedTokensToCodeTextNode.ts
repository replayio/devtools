import { $createLineBreakNode, $createTextNode, LexicalNode } from "lexical";

import CodeNode from "../CodeNode";
import { Token } from "../types";
import $createCodeNode from "./$createCodeNode";
import getTokenStyle from "./getTokenStyle";

export default function parsedTokensToCodeTextNode(tokens: Token[]): CodeNode {
  const nodes: LexicalNode[] = [];

  tokens.forEach(token => {
    const type = token.types ? getTokenStyle(token.types) || "" : "";
    const lines = token.text.split(/[\r\n]/);
    return lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        nodes.push($createLineBreakNode());
      }
      if (line !== "") {
        nodes.push($createTextNode(line).setStyle(type));
      }
    });
  });

  return $createCodeNode().append(...nodes);
}
