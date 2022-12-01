import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { RecordingId } from "@replayio/protocol";
import { TextNode } from "lexical";
import { useEffect } from "react";

import { $createReplayLinkNode, ReplayLinkNode } from "./ReplayLinkNode";

export default function ReplayLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function onTextNodeTransform(node: TextNode) {
      if (!node.isAttached()) {
        return false;
      }

      const textContent = node.getTextContent() ?? "";

      let match = ReplayLinkNode.getMatch(textContent);
      if (match) {
        const url = match[0];

        const startIndex = match.index!;
        const endIndex = startIndex + url.length;

        const replayLinkNode = $createReplayLinkNode({ url });
        const nodes = node.splitText(startIndex, endIndex);
        const nodeToReplace = startIndex === 0 ? nodes[0] : nodes[1];
        nodeToReplace.replace(replayLinkNode);
      }
    }

    return mergeRegister(editor.registerNodeTransform(TextNode, onTextNodeTransform));
  }, [editor]);

  return null;
}
