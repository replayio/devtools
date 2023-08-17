import { RefObject, useLayoutEffect } from "react";

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
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element) {
      const hitCountElement = element.querySelector('[data-test-name="SourceLine-HitCount"]');
      if (hitCountElement) {
        element.style.setProperty(
          "--source-hit-count-offset",
          `${
            (hitCountElement as HTMLElement).offsetWidth +
            parseFloat(getComputedStyle(hitCountElement).marginRight)
          }px`
        );
      }

      const lineNumberElement = element.querySelector('[data-test-name="SourceLine-LineNumber"]');
      if (lineNumberElement) {
        element.style.setProperty(
          "--source-line-number-offset",
          `${(lineNumberElement as HTMLElement).offsetWidth}px`
        );
      }
    }
  }, [elementRef, maxHitCountStringLength, maxLineIndexStringLength]);
}
