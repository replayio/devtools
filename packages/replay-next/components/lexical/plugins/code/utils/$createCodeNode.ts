import { $applyNodeReplacement } from "lexical";

import CodeNode from "../CodeNode";

export default function $createCodeNode(): CodeNode {
  return $applyNodeReplacement(new CodeNode());
}
