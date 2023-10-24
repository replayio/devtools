import { useRef } from "react";

export function useHorizontalScrollingListCssVariables(dataTestId: string) {
  const cachedMeasurementsRef = useRef<{
    longestLine: number;
  }>({
    longestLine: 0,
  });

  const onItemsRendered = () => {
    const list = document.querySelector(`[data-test-id="${dataTestId}"]`);
    if (!list) {
      console.warn(`Could not find list with selector [data-test-id="${dataTestId}"]`);
      return;
    }

    const innerElement = list.firstElementChild;
    if (innerElement) {
      let longestLine = 0;

      for (let index = 0; index < innerElement.children.length; index++) {
        const child = innerElement.children[index];

        longestLine = Math.max(longestLine, child.clientWidth);
      }

      const cachedMeasurements = cachedMeasurementsRef.current;

      if (longestLine > cachedMeasurements.longestLine) {
        cachedMeasurements.longestLine = longestLine;

        (list as HTMLDivElement).style.setProperty("--longest-line-width", `${longestLine}px`);
      }
    }
  };

  return {
    cssVariables: {
      "--longest-line-width": `${cachedMeasurementsRef.current.longestLine}px`,
    },
    onItemsRendered,
  };
}
