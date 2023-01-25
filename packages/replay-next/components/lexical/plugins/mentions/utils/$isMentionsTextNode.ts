import { LexicalNode } from "lexical";

import MentionsTextNode from "../MentionsTextNode";

export default function $isMentionsTextNode(
  node: LexicalNode | null | undefined
): node is MentionsTextNode {
  return node instanceof MentionsTextNode;
}
