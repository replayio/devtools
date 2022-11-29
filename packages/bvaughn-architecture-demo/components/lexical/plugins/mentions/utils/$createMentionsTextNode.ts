import { $applyNodeReplacement } from "lexical";

import MentionsTextNode from "../MentionsTextNode";

export default function $createMentionsTextNode(text: string): MentionsTextNode {
  const mentionsTextNode = new MentionsTextNode(text);
  mentionsTextNode.setMode("segmented").toggleDirectionless();

  return $applyNodeReplacement(mentionsTextNode);
}
