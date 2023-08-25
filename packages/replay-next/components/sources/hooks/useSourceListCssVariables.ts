import { RefObject, useCallback, useLayoutEffect, useRef } from "react";

// In order to render the source list as efficiently as possible, it uses a flat DOM structure
// This complicates positioning of items like the log point panel or inline search highlights
// These need to account for the (dynamic) size of elements like the line number and hit counts gutters,
// further complicated by the fact that these gutters have different font sizes (so calc() won't work)
// To Simplify this, the SourceList exposes those sizes (in pixels) as CSS variables
// This calculation should not run often (as the variables that drive it don't change often)
export function useSourceListCssVariables({
  elementRef,
  maxHitCountStringLength,
  maxLineIndexStringLength,
}: {
  elementRef: RefObject<HTMLElement>;
  maxHitCountStringLength: number;
  maxLineIndexStringLength: number;
}) {
  const longestLineWidthRef = useRef<number>(0);
  const cssVariablesRef = useRef<{
    "--longest-line-width": string;
    "--source-hit-count-offset": string;
    "--source-line-number-offset": string;
  }>({
    "--longest-line-width": "0px",
    "--source-hit-count-offset": "0px",
    "--source-line-number-offset": "0px",
  });

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element) {
      const hitCountElement = element.querySelector('[data-test-name="SourceLine-HitCount"]');
      if (hitCountElement) {
        const value = `${
          (hitCountElement as HTMLElement).offsetWidth +
          parseFloat(getComputedStyle(hitCountElement).marginRight)
        }px`;

        cssVariablesRef.current["--source-hit-count-offset"] = value;
        element.style.setProperty("--source-hit-count-offset", value);
      }

      const lineNumberElement = element.querySelector('[data-test-name="SourceLine-LineNumber"]');
      if (lineNumberElement) {
        const value = `${(lineNumberElement as HTMLElement).offsetWidth}px`;

        cssVariablesRef.current["--source-line-number-offset"] = value;
        element.style.setProperty("--source-line-number-offset", value);
      }
    }
  }, [elementRef, maxHitCountStringLength, maxLineIndexStringLength]);

  const itemsRenderedCallback = useCallback(() => {
    // Ensure that the list remains wide enough to horizontally scroll to the largest line we've rendered.
    // This won't quite work the same as a non-windowed solution; it's an approximation.
    const element = elementRef.current;
    if (element) {
      const innerElement = element.firstElementChild;
      if (innerElement) {
        let longestLineWidth = 0;
        for (let index = 0; index < innerElement.children.length; index++) {
          const child = innerElement.children[index];
          longestLineWidth = Math.max(longestLineWidth, child.clientWidth, child.scrollWidth);
        }

        if (longestLineWidth > longestLineWidthRef.current) {
          longestLineWidthRef.current = longestLineWidth;

          const value = `${longestLineWidth}px`;

          cssVariablesRef.current["--longest-line-width"] = value;
          element.style.setProperty("--longest-line-width", value);
        }
      }
    }
  }, [elementRef]);

  return {
    cssVariablesRef,
    itemsRenderedCallback,
  };
}
