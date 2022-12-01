import { $isTextNode, LexicalNode } from "lexical";

export default function $isSimpleText(node: LexicalNode): boolean {
  return $isTextNode(node) && typeof node.isSimpleText === "function" && node.isSimpleText();
}
