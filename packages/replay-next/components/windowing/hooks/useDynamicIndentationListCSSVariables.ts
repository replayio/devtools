import { useLayoutEffect, useRef } from "react";

import getScrollbarWidth from "replay-next/components/sources/utils/getScrollbarWidth";

type CachedMeasurements = {
  indentationSize: number;
  prevListWidth: number;
  scrollbarWidth: number;
};

const MAX_INDENTATION_SIZE = 20;

export function useDynamicIndentationListCSSVariables(dataTestId: string, listWidth: number) {
  const cachedMeasurementsRef = useRef<CachedMeasurements>({
    indentationSize: MAX_INDENTATION_SIZE,
    prevListWidth: 0,
    scrollbarWidth: -1,
  });

  useLayoutEffect(() => {
    updateMeasurements(dataTestId, listWidth, cachedMeasurementsRef.current);
  }, [dataTestId, listWidth]);

  const onItemsRendered = () => {
    updateMeasurements(dataTestId, listWidth, cachedMeasurementsRef.current);
  };

  return {
    cssVariables: {
      "--indentation-size": `${cachedMeasurementsRef.current.indentationSize}px`,
    },
    onItemsRendered,
  };
}

function updateMeasurements(
  dataTestId: string,
  listWidth: number,
  cachedMeasurements: CachedMeasurements
) {
  const list = document.querySelector(`[data-test-id="${dataTestId}"]`);
  if (!list) {
    console.warn(`Could not find list with selector [data-test-id="${dataTestId}"]`);
    return;
  }

  // Recalculate when the list is resized
  if (listWidth !== cachedMeasurements.prevListWidth) {
    cachedMeasurements.prevListWidth = listWidth;
    cachedMeasurements.indentationSize = MAX_INDENTATION_SIZE;
  }

  if (cachedMeasurements.scrollbarWidth === -1) {
    cachedMeasurements.scrollbarWidth = getScrollbarWidth();
  }

  const innerElement = list.firstElementChild;
  if (innerElement) {
    let minIndentationSize = MAX_INDENTATION_SIZE;

    for (let index = 0; index < innerElement.children.length; index++) {
      const child = innerElement.children[index];
      const content = child.querySelector('[test-data-name="ListContent"]') as HTMLDivElement;
      const depth = parseInt(child.getAttribute("data-depth") ?? "0");

      if (content && depth > 0) {
        const availableWidth = listWidth - cachedMeasurements.scrollbarWidth - content.offsetWidth;

        minIndentationSize = Math.max(0, Math.min(minIndentationSize, availableWidth / depth));
      }
    }

    if (minIndentationSize < cachedMeasurements.indentationSize) {
      cachedMeasurements.indentationSize = minIndentationSize;

      (list as HTMLDivElement).style.setProperty("--indentation-size", `${minIndentationSize}px`);
    }
  }
}
