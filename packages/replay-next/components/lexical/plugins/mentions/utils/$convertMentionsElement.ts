import { DOMConversionOutput } from "lexical";

import $createMentionsTextNode from "./$createMentionsTextNode";

export default function $convertMentionsElement(domNode: HTMLElement): DOMConversionOutput | null {
  const id = domNode.getAttribute("data-lexical-mentions-id");
  const name = domNode.getAttribute("data-lexical-mentions-name");
  if (id !== null && name !== null) {
    const node = $createMentionsTextNode(id, name);
    return {
      node,
    };
  }

  return null;
}
