import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { TextNode } from "lexical";
import { useEffect } from "react";

import { $createLoomLinkNode } from "./LoomLinkNode";

// TODO Are Loom ids always 32 chars long?
const LOOM_URL_REGEX = /[\B]{0,1}https:\/\/(www\.){0,1}loom\.com\/share\/([^\B]{32})[\B]{0,1}/;

export default function LoomLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function onTextNodeTransform(node: TextNode) {
      if (!node.isAttached()) {
        return false;
      }

      const textContent = node.getTextContent() ?? "";

      let match = textContent.match(LOOM_URL_REGEX);
      if (match) {
        const url = match[0];
        const loomId = match[2];

        const startIndex = match.index!;
        const endIndex = startIndex + url.length;

        const loomLinkNode = $createLoomLinkNode({ loomId });
        const nodes = node.splitText(startIndex, endIndex);
        const nodeToReplace = startIndex === 0 ? nodes[0] : nodes[1];
        nodeToReplace.replace(loomLinkNode);
      }
    }

    return mergeRegister(editor.registerNodeTransform(TextNode, onTextNodeTransform));
  }, [editor]);

  return null;
}
