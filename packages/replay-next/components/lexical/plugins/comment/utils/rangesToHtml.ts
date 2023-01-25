import { IS_BOLD, IS_CODE, IS_ITALIC, IS_STRIKETHROUGH, IS_UNDERLINE } from "../constants";
import { FormattedText } from "../types";

const MAP: [format: number, tagName: string][] = [
  [IS_BOLD, "strong"],
  [IS_ITALIC, "em"],
  [IS_CODE, "code"],
  [IS_STRIKETHROUGH, "del"],
  [IS_UNDERLINE, "u"],
];

// This doesn't generate the most efficient HTML for nested styles, but it's good enough.
export default function rangesToHtml(ranges: FormattedText[]): string {
  const root = document.createElement("div");

  ranges.forEach(({ format: rangeFormat, isMention, text }) => {
    const lines = text.split(/[\r\n]/);
    lines.forEach((line, lineIndex) => {
      let node: Text | HTMLElement = document.createTextNode(line);

      if (lineIndex > 0) {
        root.appendChild(document.createElement("br"));
      }

      if (rangeFormat !== null) {
        MAP.forEach(([formatBit, tagName]) => {
          if (rangeFormat & formatBit) {
            const element = document.createElement(tagName);
            element.appendChild(node);

            node = element;
          }
        });
      }

      if (isMention) {
        const element = document.createElement("label");
        element.appendChild(node);

        node = element;
      }

      root.appendChild(node);
    });
  });

  return root.innerHTML;
}
