import { LexicalNode } from "lexical";

import { LexicalHTMLElement, LexicalKey } from "../types";
import findLexicalHTMLElement from "./findLexicalHTMLElement";
import findLexicalKey from "./findLexicalKey";

export default function findDOMNode(lexicalNode: LexicalNode): HTMLElement | null {
  const lexicalHTMLElement = findLexicalHTMLElement();
  const lexicalKey = findLexicalKey();
  if (lexicalHTMLElement && lexicalKey) {
    const nodeKey = lexicalNode.getKey();

    return findDOMNodeInChildren(lexicalHTMLElement, lexicalKey, nodeKey);
  }

  return null;
}

function findDOMNodeInChildren(
  lexicalHTMLElement: LexicalHTMLElement,
  lexicalKey: LexicalKey,
  nodeKey: string
): LexicalHTMLElement | null {
  if (lexicalHTMLElement[lexicalKey] === nodeKey) {
    return lexicalHTMLElement;
  }

  const childNodes = lexicalHTMLElement.childNodes;
  for (let index = 0; index < childNodes.length; index++) {
    const childNode = childNodes[index] as LexicalHTMLElement;
    const result = findDOMNodeInChildren(childNode, lexicalKey, nodeKey);
    if (result) {
      return result;
    }
  }

  return null;
}
