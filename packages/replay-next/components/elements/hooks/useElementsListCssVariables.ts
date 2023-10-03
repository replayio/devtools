import { useRef } from "react";
import { ListOnItemsRenderedProps } from "react-window";

export function useElementsListCssVariables() {
  const longestLineWidthRef = useRef(0);

  const onItemsRendered = (props: ListOnItemsRenderedProps) => {
    // Ensure that the list remains wide enough to horizontally scroll to the largest line we've rendered.
    // This won't quite work the same as a non-windowed solution; it's an approximation.
    const list = document.querySelector('[data-test-id="ElementsList"]');
    if (list) {
      const innerElement = list.firstElementChild;
      if (innerElement) {
        let longestLineWidth = 0;
        for (let index = 0; index < innerElement.children.length; index++) {
          const child = innerElement.children[index];
          longestLineWidth = Math.max(longestLineWidth, child.clientWidth, child.scrollWidth);
        }

        if (longestLineWidth > longestLineWidthRef.current) {
          longestLineWidthRef.current = longestLineWidth;

          (list as HTMLDivElement).style.setProperty(
            "--longest-line-width",
            `${longestLineWidth}px`
          );
        }
      }
    }
  };

  return {
    cssVariables: {
      "--longest-line-width": `${longestLineWidthRef.current}px`,
    },
    onItemsRendered,
  };
}
