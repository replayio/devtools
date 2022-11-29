import { LexicalNode } from "lexical";

import CodeTextNode from "../CodeNode";

export default function $isCodeNode(node: LexicalNode | null | undefined): node is CodeTextNode {
  return node instanceof CodeTextNode;
}
