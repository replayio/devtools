import { RefObject, useState } from "react";
import { VariableSizeList as List } from "react-window";

import useClassListObserver from "./useClassListObserver";

type Measurements = {
  lineHeight: number;
  pointPanelHeight: number;
  pointPanelWithConditionalHeight: number;
};

const REGULAR_SIZE: Measurements = {
  lineHeight: 16,
  pointPanelHeight: 72,
  pointPanelWithConditionalHeight: 108,
};
const LARGE_SIZE: Measurements = {
  lineHeight: 18,
  pointPanelHeight: 72,
  pointPanelWithConditionalHeight: 108,
};

// HACK
// We could swap this out for something that lazily measures row height.
// There are only a small number of variations though, so this is more efficient.
export default function useFontBasedListMeasurements(listRef: RefObject<List>): Measurements {
  const [sizes, setSizes] = useState<Measurements>(REGULAR_SIZE);

  // Listen for font-size changes.
  useClassListObserver(document.body.parentElement!, (classList: DOMTokenList) => {
    const prefersLargeFontSize = classList.contains("prefers-large-font-size");
    if (prefersLargeFontSize) {
      setSizes(LARGE_SIZE);
    } else {
      setSizes(REGULAR_SIZE);
    }

    const list = listRef.current;
    if (list) {
      list.resetAfterIndex(0);
    }
  });

  return sizes;
}
