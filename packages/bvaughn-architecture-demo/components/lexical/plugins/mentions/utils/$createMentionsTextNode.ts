import { $applyNodeReplacement } from "lexical";

import MentionsTextNode from "../MentionsTextNode";

export default function $createMentionsTextNode(id: string, name: string): MentionsTextNode {
  const mentionsTextNode = new MentionsTextNode(id, name);
  mentionsTextNode.setMode("segmented").toggleDirectionless();

  return $applyNodeReplacement(mentionsTextNode);
}
