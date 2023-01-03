import { $createLineBreakNode, $createParagraphNode, $createTextNode, LexicalNode } from "lexical";

import { FormattedText } from "../types";

// Note that this parser currently only supports a couple of formats.
// It also has special handling to support mentions (@username).
export default function rangesToLexicalNodes(ranges: FormattedText[]): LexicalNode[] {
  let paragraphNode = $createParagraphNode();
  const nodes: LexicalNode[] = [paragraphNode];

  ranges.forEach(range => {
    const lines = range.text.split(/[\r\n]/);
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        paragraphNode.append($createLineBreakNode());
      }

      if (range.isMention) {
        const textNode = $createTextNode(line);
        paragraphNode.append(textNode);
      } else if (range.format !== null) {
        const textNode = $createTextNode(line);
        textNode.setFormat(range.format);
        paragraphNode.append(textNode);
      } else {
        const textNode = $createTextNode(line);
        paragraphNode.append(textNode);
      }
    });
  });

  return nodes;
}
