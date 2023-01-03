import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import type { ElementNode, LexicalNode } from "lexical";
import { $createTextNode, $isElementNode, $isLineBreakNode, $isTextNode, TextNode } from "lexical";
import { useEffect } from "react";

import MATCHERS from "./AutoLinkMatchers";
import { $createAutoLinkNode, $isAutoLinkNode, $isLinkNode, AutoLinkNode } from "./AutoLinkNode";

// Forked with modifications from packages/lexical-react/src/LexicalAutoLinkPlugin

export type LinkMatch = {
  formattedText: string | null;
  index: number;
  length: number;
  text: string;
  url: string;
};

export default function AutoLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerNodeTransform(TextNode, (textNode: TextNode) => {
        const parent = textNode.getParentOrThrow();
        if ($isAutoLinkNode(parent)) {
          handleLinkEdit(parent);
        } else if (!$isLinkNode(parent)) {
          if (textNode.isSimpleText()) {
            handleLinkCreation(textNode);
          }

          handleBadNeighbors(textNode);
        }
      })
    );
  }, [editor]);

  return null;
}

function findFirstMatch(text: string): LinkMatch | null {
  for (let i = 0; i < MATCHERS.length; i++) {
    const match = MATCHERS[i](text);
    if (match) {
      return match;
    }
  }

  return null;
}

const PUNCTUATION_OR_SPACE = /[.,;!\s]/;

function isSeparator(char: string): boolean {
  return PUNCTUATION_OR_SPACE.test(char);
}

function endsWithSeparator(textContent: string): boolean {
  return isSeparator(textContent[textContent.length - 1]);
}

function startsWithSeparator(textContent: string): boolean {
  return isSeparator(textContent[0]);
}

function isPreviousNodeValid(node: LexicalNode): boolean {
  let previousNode = node.getPreviousSibling();
  if ($isElementNode(previousNode)) {
    previousNode = previousNode.getLastDescendant();
  }
  return (
    previousNode === null ||
    $isLineBreakNode(previousNode) ||
    ($isTextNode(previousNode) && endsWithSeparator(previousNode.getTextContent()))
  );
}

function isNextNodeValid(node: LexicalNode): boolean {
  let nextNode = node.getNextSibling();
  if ($isElementNode(nextNode)) {
    nextNode = nextNode.getFirstDescendant();
  }
  return (
    nextNode === null ||
    $isLineBreakNode(nextNode) ||
    ($isTextNode(nextNode) && startsWithSeparator(nextNode.getTextContent()))
  );
}

function isContentAroundIsValid(
  matchStart: number,
  matchEnd: number,
  text: string,
  node: TextNode
): boolean {
  const contentBeforeIsValid =
    matchStart > 0 ? isSeparator(text[matchStart - 1]) : isPreviousNodeValid(node);
  if (!contentBeforeIsValid) {
    return false;
  }

  const contentAfterIsValid =
    matchEnd < text.length ? isSeparator(text[matchEnd]) : isNextNodeValid(node);
  return contentAfterIsValid;
}

function handleLinkCreation(node: TextNode): void {
  const nodeText = node.getTextContent();
  let text = nodeText;
  let invalidMatchEnd = 0;
  let remainingTextNode = node;
  let match;

  while ((match = findFirstMatch(text)) && match !== null) {
    const matchStart = match.index;
    const matchLength = match.length;
    const matchEnd = matchStart + matchLength;
    const isValid = isContentAroundIsValid(
      invalidMatchEnd + matchStart,
      invalidMatchEnd + matchEnd,
      nodeText,
      node
    );

    if (isValid) {
      let linkTextNode;
      if (invalidMatchEnd + matchStart === 0) {
        [linkTextNode, remainingTextNode] = remainingTextNode.splitText(
          invalidMatchEnd + matchLength
        );
      } else {
        [, linkTextNode, remainingTextNode] = remainingTextNode.splitText(
          invalidMatchEnd + matchStart,
          invalidMatchEnd + matchStart + matchLength
        );
      }
      const linkNode = $createAutoLinkNode(match.url, match.formattedText);
      const textNode = $createTextNode(match.text);
      textNode.setFormat(linkTextNode.getFormat());
      textNode.setDetail(linkTextNode.getDetail());
      linkNode.append(textNode);
      linkTextNode.replace(linkNode);

      invalidMatchEnd = 0;
    } else {
      invalidMatchEnd += matchEnd;
    }

    text = text.substring(matchEnd);
  }
}

function handleLinkEdit(linkNode: AutoLinkNode): void {
  // Check children are simple text
  const children = linkNode.getChildren();
  const childrenLength = children.length;
  for (let i = 0; i < childrenLength; i++) {
    const child = children[i];
    if (!$isTextNode(child) || !child.isSimpleText()) {
      replaceWithChildren(linkNode);
      return;
    }
  }

  // Check text content fully matches
  const text = linkNode.getTextContent();
  const match = findFirstMatch(text);
  if (match === null || match.text !== text) {
    replaceWithChildren(linkNode);
    return;
  }

  // Check neighbors
  if (!isPreviousNodeValid(linkNode) || !isNextNodeValid(linkNode)) {
    replaceWithChildren(linkNode);
    return;
  }

  const url = linkNode.getURL();
  if (url !== match.url) {
    linkNode.setURL(match.url);
  }
}

// Bad neighbors are edits in neighbor nodes that make AutoLinks incompatible.
// Given the creation preconditions, these can only be simple text nodes.
function handleBadNeighbors(textNode: TextNode): void {
  const previousSibling = textNode.getPreviousSibling();
  const nextSibling = textNode.getNextSibling();
  const text = textNode.getTextContent();

  if ($isAutoLinkNode(previousSibling) && !startsWithSeparator(text)) {
    replaceWithChildren(previousSibling);
  }

  if ($isAutoLinkNode(nextSibling) && !endsWithSeparator(text)) {
    replaceWithChildren(nextSibling);
  }
}

function replaceWithChildren(node: ElementNode): Array<LexicalNode> {
  const children = node.getChildren();
  const childrenLength = children.length;

  for (let j = childrenLength - 1; j >= 0; j--) {
    node.insertAfter(children[j]);
  }

  node.remove();
  return children.map(child => child.getLatest());
}
