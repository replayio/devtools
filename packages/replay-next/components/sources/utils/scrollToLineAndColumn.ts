import { RefObject } from "react";
import { FixedSizeList, VariableSizeList } from "react-window";

import getScrollbarWidth from "replay-next/components/sources/utils/getScrollbarWidth";

type List = Exclude<RefObject<FixedSizeList | VariableSizeList>["current"], null>;

let pendingScrollAbortController: AbortController | null = null;

export async function scrollToLineAndColumn({
  columnNumber,
  containerElement,
  lineNumber,
  list,
  mode,
  timeoutInterval = 25,
}: {
  columnNumber: number;
  containerElement: HTMLElement;
  lineNumber: number;
  list: List;
  mode: "center" | "smart";
  timeoutInterval?: number;
}) {
  if (pendingScrollAbortController !== null) {
    pendingScrollAbortController.abort();
    pendingScrollAbortController = null;
  }

  list.scrollToItem(lineNumber - 1, mode);

  if (columnNumber != null) {
    const abortController = new AbortController();

    pendingScrollAbortController = abortController;

    // Wait until the row we've scrolled to has been rendered before trying to scroll to the column
    // because the source viewer might not yet be wide enough to scroll that far
    // (As the list renders new rows, it expands to fit the widest row)
    const checkForRenderedRow = () => {
      if (abortController.signal.aborted) {
        return;
      }

      const line = containerElement.querySelector(`[data-test-id="SourceLine-${lineNumber}"]`);
      if (!line) {
        setTimeout(checkForRenderedRow, timeoutInterval);
        return;
      }

      // Note that we should not rely on the syntax highlighted chunks ([data-column-index])
      // because they might not be granular enough,
      // and they won't be rendered it he line is too long
      // Instead we should calculate the width of a character,
      // and scroll so that it is centered within the source viewer
      const characterContainer = line.querySelector('[data-test-name="SourceLine-Contents"]');
      if (characterContainer) {
        // Reset scroll before calculating that gutter width
        containerElement.scrollLeft = 0;

        // Text is rendered within this element
        // It comes after the line number and hit count numbers (the gutter)
        const containerRect = containerElement.getBoundingClientRect();
        const characterContainerRect = characterContainer.getBoundingClientRect();
        const gutter = characterContainerRect.left - containerRect.left;

        // Calculate the width of a character; remember this is monospace so all characters will have the same width
        const span = document.createElement("span");
        span.textContent = "h";
        characterContainer.appendChild(span);
        const spanRect = span.getBoundingClientRect();
        const characterWidth = spanRect.width;
        characterContainer.removeChild(span);

        const availableWidth = containerRect.width - gutter - getScrollbarWidth();
        const numCharacters = Math.floor(availableWidth / characterWidth);

        // Try to center-align the character within the source viewer
        const offset = gutter + characterWidth * (columnNumber - numCharacters / 2);

        // We can't use scrollIntoView() because it will mess up the vertical offset from react-window
        containerElement.scrollLeft = offset;
      }
    };

    checkForRenderedRow();
  }
}
