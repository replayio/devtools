import { DOMConversionOutput } from "lexical";

import $createCodeNode from "./$createCodeNode";

export default function $convertCodeElement(domNode: HTMLElement): DOMConversionOutput | null {
  const textContent = domNode.textContent;
  if (textContent !== null) {
    const node = $createCodeNode();
    return {
      node,
    };
  }

  return null;
}
