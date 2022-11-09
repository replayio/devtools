declare global {
  interface CaretPosition {
    readonly offset: number;
    readonly offsetNode: Node;
    getClientRect(): DOMRect | null;
  }

  interface Document {
    readonly caretPositionFromPoint: (clientX: number, clientY: number) => CaretPosition | null;
  }
}

export default function getTextAndCursorIndex(
  clientX: number,
  clientY: number
): [text: string, cursorIndex: number] | null {
  // Firefox
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/caretPositionFromPoint
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(clientX, clientY);
    if (position !== null) {
      const textContent = position.offsetNode.textContent;
      const offset = position.offset;
      if (textContent) {
        return [textContent, offset];
      }
    }
  } else if (document.caretRangeFromPoint) {
    // Chrome, Edge, and Safari
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/caretRangeFromPoint
    const range = document.caretRangeFromPoint(clientX, clientY);
    if (range) {
      const textContent = range.startContainer.textContent;
      const offset = range.startOffset;
      if (textContent) {
        return [textContent, offset];
      }
    }
  }

  return null;
}
