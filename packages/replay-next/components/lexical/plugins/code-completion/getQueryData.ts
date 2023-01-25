import { $isRangeSelection, LexicalNode, TextNode } from "lexical";

import { QueryData, TypeAheadSelection } from "../typeahead/types";
import $isSimpleText from "../typeahead/utils/$isSimpleText";
import getTokenTypesForCursorPosition from "../typeahead/utils/getTokenTypesForCursorPosition";

export default function getQueryData(selection: TypeAheadSelection | null): QueryData | null {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null;
  }

  const node = selection.getNodes()[0];
  if (!$isSimpleText(node)) {
    return null;
  }

  const anchor = selection.anchor;
  const offset = anchor.offset;

  const tokenTypes = getTokenTypesForCursorPosition(node, offset);
  if (tokenTypes == null || tokenTypes.length === 0) {
    return null;
  } else {
    switch (tokenTypes[0]) {
      case "comment":
      case "number":
      case "punctuation":
      case "string":
      case "string2":
        return null;
    }
  }

  let insertionBeginOffset = -1;
  let insertionBeginTextNode: LexicalNode | null = null;
  let positionBeginOffset = -1;
  let positionBeginTextNode: LexicalNode | null = null;
  let dotCount = 0;

  {
    let currentOffset = offset - 1;
    let currentTextNode: LexicalNode | null = node;
    let currentText = node.getTextContent();

    if (currentTextNode !== null) {
      back: while (true) {
        for (currentOffset; currentOffset >= 0; currentOffset--) {
          const char = currentText.charAt(currentOffset);
          if (char === ".") {
            if (insertionBeginTextNode === null) {
              // Replace everything after the first "." (e.g. "window.loc|" => "window.location")
              // Be careful not to replace the "." itself if we are anchored after it (e.g. "window.|")
              if (currentOffset + 1 < currentText.length) {
                insertionBeginOffset = currentOffset + 1;
                insertionBeginTextNode = currentTextNode;
              } else {
                const nextTextNode = currentTextNode.getNextSibling();
                if (nextTextNode !== null) {
                  insertionBeginOffset = 0;
                  insertionBeginTextNode = currentTextNode.getNextSibling();
                } else {
                  insertionBeginOffset = offset;
                  insertionBeginTextNode = node;
                }
              }
            }

            dotCount++;
          }

          if (isBoundaryChar(char)) {
            // We've found the beginning of this expression.
            break back;
          }

          positionBeginOffset = currentOffset;
          positionBeginTextNode = currentTextNode;
        }

        const previousTextNode: TextNode | null = currentTextNode.getPreviousSibling();
        if (previousTextNode === null || !$isSimpleText(previousTextNode)) {
          break back;
        }

        currentTextNode = previousTextNode;
        currentText = previousTextNode.getTextContent();
        currentOffset = currentText.length - 1;
      }
    }

    if (insertionBeginTextNode === null) {
      // Edge case; replace the whole text (e.g. "win|" -> "window")
      insertionBeginOffset = positionBeginOffset;
      insertionBeginTextNode = positionBeginTextNode;
    }
  }

  let expression = "";

  let insertionEndOffset = -1;
  let insertionEndTextNode: LexicalNode | null = null;
  let positionEndOffset = -1;
  let positionEndTextNode: LexicalNode | null = null;

  {
    let currentOffset = positionBeginOffset;
    let currentTextNode: LexicalNode | null = positionBeginTextNode;
    let currentText = positionBeginTextNode?.getTextContent() ?? "";

    if (currentTextNode !== null) {
      let prevOffset: number = -1;
      let prevTextNode: LexicalNode | null = null;

      forward: while (true) {
        for (currentOffset; currentOffset < currentText.length; currentOffset++) {
          const char = currentText.charAt(currentOffset);
          if (isBoundaryChar(char)) {
            if (insertionEndTextNode === null) {
              insertionEndTextNode = currentTextNode;
              insertionEndOffset = currentOffset;
            }

            if (positionEndTextNode === null) {
              positionEndTextNode = currentTextNode;
              positionEndOffset = currentOffset;
            }

            break forward;
          } else if (char === ".") {
            if (dotCount === 0) {
              // If the cursor is within an expression (e.g. "window.loca|tion.href") then break once we reach the next "."
              positionEndOffset = currentOffset;
              positionEndTextNode = currentTextNode;

              // To match Chrome's behavior we should also only replace things between the dots (e.g. "wd|w.location" => "window.location")
              insertionEndTextNode = prevTextNode;
              insertionEndOffset = prevOffset;
            }

            dotCount--;
          }

          if (positionEndTextNode === null) {
            expression += char;
          }
        }

        const nextTextNode: TextNode | null = currentTextNode.getNextSibling();
        if (nextTextNode === null) {
          // We've reached the end of the text.
          break forward;
        } else if (!$isSimpleText(nextTextNode)) {
          // Don't try to parse complex nodes.
          break forward;
        } else {
          const nextTextContent = nextTextNode.getTextContent() || "";
          const nextChar = nextTextContent.charAt(0);
          if (isBoundaryChar(nextChar)) {
            // If the next node is a boundary, end on the current node.
            break forward;
          }
        }

        prevOffset = currentOffset;
        prevTextNode = currentTextNode;

        currentTextNode = nextTextNode;
        currentText = nextTextNode.getTextContent();
        currentOffset = 0;
      }
    }

    if (insertionEndTextNode === null) {
      insertionEndOffset = currentOffset;
      insertionEndTextNode = currentTextNode;
    }

    if (positionEndTextNode === null) {
      positionEndOffset = currentOffset;
      positionEndTextNode = currentTextNode;
    }
  }

  const pieces = expression.split(".");
  const query = "." + (pieces[pieces.length - 1] || "");
  const queryAdditionalData = pieces.slice(0, -1).join(".") || "";

  if (insertionBeginTextNode === null) {
    insertionBeginTextNode = node;
    insertionBeginOffset = offset;
  }
  if (insertionEndTextNode === null) {
    insertionEndTextNode = node;
    insertionEndOffset = offset;
  }

  return {
    query,
    queryAdditionalData,
    textRange: {
      beginOffset: insertionBeginOffset,
      beginTextNode: insertionBeginTextNode,
      endOffset: insertionEndOffset,
      endTextNode: insertionEndTextNode,
    },
  };
}

function isBoundaryChar(char: string): boolean {
  return char.match(/[\s{},'"]/) !== null;
}
