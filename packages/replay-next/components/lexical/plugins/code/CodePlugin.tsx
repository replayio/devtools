import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isLineBreakNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_TAB_COMMAND,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  MOVE_TO_END,
  MOVE_TO_START,
  NodeKey,
  TextNode,
} from "lexical";
import { useEffect } from "react";

import CodeNode from "./CodeNode";
import $createCodeNode from "./utils/$createCodeNode";
import $isCodeNode from "./utils/$isCodeNode";
import parsedTokensToCodeTextNode from "./utils/parsedTokensToCodeTextNode";
import parseTokens from "./utils/parseTokens";

export default function CodePlugin({
  preventTabFocusChange,
}: {
  preventTabFocusChange: boolean;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function onTextNodeTransform(node: TextNode) {
      // Since CodeNode has flat children structure we only need to check if node's parent is a code node and run highlighting.
      const parentNode = node.getParent();
      if ($isCodeNode(parentNode)) {
        codeNodeTransform(parentNode, editor);
      } else if ($isParagraphNode(parentNode)) {
        // Copy-paste sometimes inserts ParagraphNodes, which interfere with this plugin.
        const terminalNode = $createCodeNode();
        terminalNode.append(...parentNode.getChildren());
        parentNode.replace(terminalNode);
      }
    }

    const onTabCommand = (event: KeyboardEvent) => {
      if (preventTabFocusChange) {
        event.preventDefault();
      }

      // Tab key should not indent code blocks.
      return true;
    };

    return mergeRegister(
      editor.registerNodeTransform(TextNode, onTextNodeTransform),
      editor.registerCommand(KEY_TAB_COMMAND, onTabCommand, COMMAND_PRIORITY_NORMAL),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (payload): boolean => handleShiftLines(KEY_ARROW_UP_COMMAND, payload),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (payload): boolean => handleShiftLines(KEY_ARROW_DOWN_COMMAND, payload),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        MOVE_TO_END,
        (payload): boolean => handleMoveTo(MOVE_TO_END, payload),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        MOVE_TO_START,
        (payload): boolean => handleMoveTo(MOVE_TO_START, payload),
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, preventTabFocusChange]);

  return null;
}

function codeNodeTransform(node: CodeNode, editor: LexicalEditor) {
  const nodeKey = node.getKey();

  editor.update(() => {
    updateAndRetainSelection(nodeKey, () => {
      const currentNode = $getNodeByKey(nodeKey);
      if (!$isCodeNode(currentNode) || !currentNode.isAttached()) {
        return false;
      }

      const textContent = currentNode.getTextContent();
      const tokens = parseTokens(textContent);
      if (tokens === null) {
        return false;
      }

      const newCodeTextNode = parsedTokensToCodeTextNode(tokens);

      const diffRange = getDiffRange(currentNode.getChildren(), newCodeTextNode.getChildren());
      const { from, to, nodesForReplacement } = diffRange;

      if (from !== to || nodesForReplacement.length) {
        node.splice(from, to - from, nodesForReplacement);
        return true;
      }

      return false;
    });
  });
}

function getDiffRange(
  prevNodes: Array<LexicalNode>,
  nextNodes: Array<LexicalNode>
): {
  from: number;
  nodesForReplacement: Array<LexicalNode>;
  to: number;
} {
  let leadingMatch = 0;
  while (leadingMatch < prevNodes.length) {
    if (!isEqual(prevNodes[leadingMatch], nextNodes[leadingMatch])) {
      break;
    }
    leadingMatch++;
  }

  const prevNodesLength = prevNodes.length;
  const nextNodesLength = nextNodes.length;
  const maxTrailingMatch = Math.min(prevNodesLength, nextNodesLength) - leadingMatch;

  let trailingMatch = 0;
  while (trailingMatch < maxTrailingMatch) {
    trailingMatch++;
    if (
      !isEqual(
        prevNodes[prevNodesLength - trailingMatch],
        nextNodes[nextNodesLength - trailingMatch]
      )
    ) {
      trailingMatch--;
      break;
    }
  }

  const from = leadingMatch;
  const to = prevNodesLength - trailingMatch;
  const nodesForReplacement = nextNodes.slice(leadingMatch, nextNodesLength - trailingMatch);
  return {
    from,
    nodesForReplacement,
    to,
  };
}

function findFirstNotSpaceOrTabCharAtText(text: string, isForward: boolean): number {
  const length = text.length;
  let offset = -1;

  if (isForward) {
    for (let i = 0; i < length; i++) {
      const char = text[i];
      if (!isSpaceOrTabChar(char)) {
        offset = i;
        break;
      }
    }
  } else {
    for (let i = length - 1; i > -1; i--) {
      const char = text[i];
      if (!isSpaceOrTabChar(char)) {
        offset = i;
        break;
      }
    }
  }

  return offset;
}

export function getEndOfCodeInLine(anchor: LexicalNode): {
  node: TextNode | null;
  offset: number;
} {
  let currentNode = null;
  let currentNodeOffset = -1;
  const nextSiblings = anchor.getNextSiblings();
  nextSiblings.unshift(anchor);
  while (nextSiblings.length > 0) {
    const node = nextSiblings.shift();
    if ($isTextNode(node)) {
      const text = node.getTextContent();
      const offset = findFirstNotSpaceOrTabCharAtText(text, false);
      if (offset !== -1) {
        currentNode = node;
        currentNodeOffset = offset + 1;
      }
    }
    if ($isLineBreakNode(node)) {
      break;
    }
  }

  if (currentNode === null) {
    const previousSiblings = anchor.getPreviousSiblings();
    while (previousSiblings.length > 0) {
      const node = previousSiblings.pop();
      if ($isTextNode(node)) {
        const text = node.getTextContent();
        const offset = findFirstNotSpaceOrTabCharAtText(text, false);
        if (offset !== -1) {
          currentNode = node;
          currentNodeOffset = offset + 1;
          break;
        }
      }
      if ($isLineBreakNode(node)) {
        break;
      }
    }
  }

  return {
    node: currentNode,
    offset: currentNodeOffset,
  };
}

export function getFirstTextNodeOfLine(anchor: LexicalNode): TextNode | null | undefined {
  let currentNode = null;
  const previousSiblings = anchor.getPreviousSiblings();
  previousSiblings.push(anchor);
  while (previousSiblings.length > 0) {
    const node = previousSiblings.pop();
    if ($isTextNode(node)) {
      currentNode = node;
    }
    if ($isLineBreakNode(node)) {
      break;
    }
  }

  return currentNode;
}

export function getLastTextNodeOfLine(anchor: LexicalNode): TextNode | null | undefined {
  let currentNode = null;
  const nextSiblings = anchor.getNextSiblings();
  nextSiblings.unshift(anchor);
  while (nextSiblings.length > 0) {
    const node = nextSiblings.shift();
    if ($isTextNode(node)) {
      currentNode = node;
    }
    if ($isLineBreakNode(node)) {
      break;
    }
  }

  return currentNode;
}

export function getStartOfCodeInLine(anchor: LexicalNode): {
  node: TextNode | null;
  offset: number;
} {
  let currentNode = null;
  let currentNodeOffset = -1;
  const previousSiblings = anchor.getPreviousSiblings();
  previousSiblings.push(anchor);
  while (previousSiblings.length > 0) {
    const node = previousSiblings.pop();
    if ($isTextNode(node)) {
      const text = node.getTextContent();
      const offset = findFirstNotSpaceOrTabCharAtText(text, true);
      if (offset !== -1) {
        currentNode = node;
        currentNodeOffset = offset;
      }
    }
    if ($isLineBreakNode(node)) {
      break;
    }
  }

  if (currentNode === null) {
    const nextSiblings = anchor.getNextSiblings();
    while (nextSiblings.length > 0) {
      const node = nextSiblings.shift();
      if ($isTextNode(node)) {
        const text = node.getTextContent();
        const offset = findFirstNotSpaceOrTabCharAtText(text, true);
        if (offset !== -1) {
          currentNode = node;
          currentNodeOffset = offset;
          break;
        }
      }
      if ($isLineBreakNode(node)) {
        break;
      }
    }
  }

  return {
    node: currentNode,
    offset: currentNodeOffset,
  };
}

function handleShiftLines(type: LexicalCommand<KeyboardEvent>, event: KeyboardEvent): boolean {
  // We only care about the alt+arrow keys
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }

  // I'm not quite sure why, but it seems like calling anchor.getNode() collapses the selection here
  // So first, get the anchor and the focus, then get their nodes
  const { anchor, focus } = selection;
  const anchorOffset = anchor.offset;
  const focusOffset = focus.offset;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  const arrowIsUp = type === KEY_ARROW_UP_COMMAND;

  // Ensure the selection is within the codeblock
  // if (!$isCodeNode(anchorNode) || !$isCodeNode(focusNode)) {
  //   return false;
  // }
  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) {
    return false;
  }

  if (!event.altKey) {
    // Handle moving selection out of the code block, given there are no
    // sibling thats can natively take the selection.
    if (selection.isCollapsed()) {
      const codeNode = anchorNode.getParentOrThrow();
      if (arrowIsUp && anchorOffset === 0 && anchorNode.getPreviousSibling() === null) {
        const codeNodeSibling = codeNode.getPreviousSibling();
        if (codeNodeSibling === null) {
          codeNode.selectPrevious();
          event.preventDefault();
          return true;
        }
      } else if (
        !arrowIsUp &&
        anchorOffset === anchorNode.getTextContentSize() &&
        anchorNode.getNextSibling() === null
      ) {
        const codeNodeSibling = codeNode.getNextSibling();
        if (codeNodeSibling === null) {
          codeNode.selectNext();
          event.preventDefault();
          return true;
        }
      }
    }
    return false;
  }

  const start = getFirstTextNodeOfLine(anchorNode);
  const end = getLastTextNodeOfLine(focusNode);
  if (start == null || end == null) {
    return false;
  }

  const range = start.getNodesBetween(end);
  for (let i = 0; i < range.length; i++) {
    const node = range[i];
    if (!$isCodeNode(node) && !$isLineBreakNode(node)) {
      return false;
    }
  }

  // After this point, we know the selection is within the codeblock. We may not be able to
  // actually move the lines around, but we want to return true either way to prevent
  // the event's default behavior
  event.preventDefault();
  event.stopPropagation(); // required to stop cursor movement under Firefox

  const linebreak = arrowIsUp ? start.getPreviousSibling() : end.getNextSibling();
  if (!$isLineBreakNode(linebreak)) {
    return true;
  }
  const sibling = arrowIsUp ? linebreak.getPreviousSibling() : linebreak.getNextSibling();
  if (sibling == null) {
    return true;
  }

  const maybeInsertionPoint = arrowIsUp
    ? getFirstTextNodeOfLine(sibling)
    : getLastTextNodeOfLine(sibling);
  let insertionPoint = maybeInsertionPoint != null ? maybeInsertionPoint : sibling;
  linebreak.remove();
  range.forEach(node => node.remove());
  if (type === KEY_ARROW_UP_COMMAND) {
    range.forEach(node => insertionPoint.insertBefore(node));
    insertionPoint.insertBefore(linebreak);
  } else {
    insertionPoint.insertAfter(linebreak);
    insertionPoint = linebreak;
    range.forEach(node => {
      insertionPoint.insertAfter(node);
      insertionPoint = node;
    });
  }

  selection.setTextNodeRange(anchorNode, anchorOffset, focusNode, focusOffset);

  return true;
}

function handleMoveTo(type: LexicalCommand<KeyboardEvent>, event: KeyboardEvent): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }

  const { anchor, focus } = selection;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  const isMoveToStart = type === MOVE_TO_START;

  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) {
    return false;
  }

  let node;
  let offset;

  if (isMoveToStart) {
    ({ node, offset } = getStartOfCodeInLine(focusNode));
  } else {
    ({ node, offset } = getEndOfCodeInLine(focusNode));
  }

  if (node !== null && offset !== -1) {
    selection.setTextNodeRange(node, offset, node, offset);
  }

  event.preventDefault();
  event.stopPropagation();

  return true;
}

function isEqual(nodeA: LexicalNode, nodeB: LexicalNode): boolean {
  if ($isTextNode(nodeA) && $isTextNode(nodeB)) {
    return (
      nodeA.__format === nodeB.__format &&
      nodeA.__text === nodeB.__text &&
      nodeA.__style === nodeB.__style
    );
  } else if ($isLineBreakNode(nodeA) && $isLineBreakNode(nodeB)) {
    return true;
  } else {
    return false;
  }
}

function isSpaceOrTabChar(char: string): boolean {
  return char === " " || char === "\t";
}

function updateAndRetainSelection(nodeKey: NodeKey, updateFn: () => boolean): void {
  const node = $getNodeByKey(nodeKey);
  if (!$isCodeNode(node) || !node.isAttached()) {
    return;
  }
  const selection = $getSelection();
  // If it's not range selection (or null selection) there's no need to change it,
  // but we can still run highlighting logic
  if (!$isRangeSelection(selection)) {
    updateFn();
    return;
  }

  const anchor = selection.anchor;
  const anchorOffset = anchor.offset;
  const isNewLineAnchor =
    anchor.type === "element" && $isLineBreakNode(node.getChildAtIndex(anchor.offset - 1));
  let textOffset = 0;

  // Calculating previous text offset (all text node prior to anchor + anchor own text offset)
  if (!isNewLineAnchor) {
    const anchorNode = anchor.getNode();
    textOffset =
      anchorOffset +
      anchorNode.getPreviousSiblings().reduce((offset, _node) => {
        return offset + ($isLineBreakNode(_node) ? 0 : _node.getTextContentSize());
      }, 0);
  }

  const hasChanges = updateFn();
  if (!hasChanges) {
    return;
  }

  // Non-text anchors only happen for line breaks, otherwise
  // selection will be within text node (code highlight node)
  if (isNewLineAnchor) {
    anchor.getNode().select(anchorOffset, anchorOffset);
    return;
  }

  // If it was non-element anchor then we walk through child nodes
  // and looking for a position of original text offset
  node.getChildren().some(_node => {
    if ($isTextNode(_node)) {
      const textContentSize = _node.getTextContentSize();
      if (textContentSize >= textOffset) {
        _node.select(textOffset, textOffset);
        return true;
      }
      textOffset -= textContentSize;
    }
    return false;
  });
}
