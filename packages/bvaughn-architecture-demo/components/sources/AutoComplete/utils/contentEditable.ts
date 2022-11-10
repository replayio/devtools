import getExpressionRange from "bvaughn-architecture-demo/components/sources/utils/getExpressionRange";

import { measureTextForHTMLElement } from "./text";

export function getCursorClientX(contentEditable: HTMLElement): number {
  const cursorIndex = getCursorIndex(contentEditable);
  const [startIndex] = getExpressionRange(contentEditable.textContent!, cursorIndex);

  let relativeCursorPosition = 0;
  if (startIndex > 0) {
    // Find the beginning of the portion of the expression we are auto-completing.
    // This is what we want to align any auto-complete suggestions with.
    // For example, "location" would begin with "l" and "window.location" would also begin with "l".
    const text = contentEditable.textContent!.slice(0, startIndex);
    const textMetrics = measureTextForHTMLElement(text, contentEditable);

    relativeCursorPosition = textMetrics.width;
  }

  // Convert the relative text position to be global to the window.
  const rect = contentEditable.getBoundingClientRect();

  return rect.left + relativeCursorPosition;
}

export function getCursorIndex(contentEditable: HTMLElement): number {
  const selection = window.getSelection();
  if (selection) {
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range) {
        const startOffset = range.startOffset;
        const startContainer = range.startContainer;

        let textIndex = 0;
        for (let nodeIndex = 0; nodeIndex < contentEditable.childNodes.length; nodeIndex++) {
          const childNode = contentEditable.childNodes[nodeIndex];
          const textContentLength = childNode.textContent!.length;

          const textNode = childNode.nodeType === Node.TEXT_NODE ? childNode : childNode.firstChild;
          if (textNode === startContainer) {
            return textIndex + startOffset;
          }

          textIndex += textContentLength;
        }
      }
    }
  }

  return contentEditable.textContent!.length;
}

export function selectAllText(contentEditable: HTMLElement): void {
  contentEditable.focus();

  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(contentEditable);

    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function selectText(
  contentEditable: HTMLElement,
  indexStart: number,
  indexStop: number = indexStart + 1
): void {
  contentEditable.focus();

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();

    let textIndex = 0;
    for (let nodeIndex = 0; nodeIndex < contentEditable.childNodes.length; nodeIndex++) {
      const childNode = contentEditable.childNodes[nodeIndex];
      const textContentLength = childNode.textContent!.length;

      if (textIndex >= indexStart) {
        const relativeIndexStart = Math.max(0, indexStart - textIndex);
        const relativeIndexStop = Math.min(indexStop - textIndex, textContentLength);

        const textNode = childNode.nodeType === Node.TEXT_NODE ? childNode : childNode.firstChild!;

        const range = document.createRange();
        range.setStart(textNode, relativeIndexStart);
        range.setEnd(textNode, relativeIndexStop);

        // Note that only Firefox supports multiple Ranges within a selection.
        // Other browsers ignore all but the first Range.
        selection.addRange(range);

        if (indexStop <= textIndex + textContentLength) {
          return;
        }
      }

      textIndex += textContentLength;
    }
  }
}

export function setCursor(contentEditable: HTMLElement, index: number): void {
  contentEditable.focus();

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();

    let textIndex = 0;
    for (let nodeIndex = 0; nodeIndex < contentEditable.childNodes.length; nodeIndex++) {
      const childNode = contentEditable.childNodes[nodeIndex];
      const textContentLength = childNode.textContent!.length;

      if (textIndex + textContentLength >= index) {
        const relativeIndex = Math.max(0, index - textIndex);

        const textNode = childNode.nodeType === Node.TEXT_NODE ? childNode : childNode.firstChild!;

        const range = document.createRange();
        range.setStart(textNode, relativeIndex);
        range.collapse(true);

        selection.addRange(range);

        return;
      }

      textIndex += textContentLength;
    }

    const range = document.createRange();
    range.setStart(contentEditable, contentEditable.childNodes.length);
    range.collapse(true);

    selection.addRange(range);
  }
}
