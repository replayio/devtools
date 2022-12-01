import { DOMConversionOutput } from "lexical";

import $createMentionsTextNode from "./$createMentionsTextNode";

export default function $convertMentionsElement(domNode: HTMLElement): DOMConversionOutput | null {
  const textContent = domNode.textContent;
  if (textContent !== null) {
    const node = $createMentionsTextNode(textContent);
    return {
      node,
    };
  }

  return null;
}
