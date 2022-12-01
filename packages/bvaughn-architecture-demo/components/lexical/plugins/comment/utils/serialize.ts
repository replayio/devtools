import { $getRoot, $isLineBreakNode, $isParagraphNode, $isTextNode, EditorState } from "lexical";

import { IS_BOLD, IS_CODE, IS_ITALIC, IS_STRIKETHROUGH } from "../constants";

// Note that this parser currently only supports a couple of formats,
// and does not support multiple formats per TextNode.
export default function serialize(editorState: EditorState): string {
  let text = "";

  editorState.read(() => {
    const root = $getRoot();
    root.getChildren().forEach(paragraphNode => {
      if ($isParagraphNode(paragraphNode)) {
        paragraphNode.getChildren().forEach(child => {
          if ($isLineBreakNode(child)) {
            text += "\n";
            return;
          }

          if ($isTextNode(child)) {
            const nodeFormat = child.getFormat();
            let nodeText = child.getTextContent();

            if (nodeFormat & IS_BOLD) {
              nodeText = `**${nodeText}**`;
            }
            if (nodeFormat & IS_CODE) {
              nodeText = `\`${nodeText}\``;
            }
            if (nodeFormat & IS_ITALIC) {
              nodeText = `_${nodeText}_`;
            }
            if (nodeFormat & IS_STRIKETHROUGH) {
              nodeText = `~~${nodeText}~~`;
            }

            text += nodeText;
          } else if (typeof child.getTextContent === "function") {
            text += child.getTextContent();
          }
        });
      } else {
        console.warn("Unexpected root child type:", paragraphNode);
      }
    });
  });

  return text;
}
