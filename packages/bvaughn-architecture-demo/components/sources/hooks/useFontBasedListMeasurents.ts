import { RefObject, useState } from "react";
import { VariableSizeList as List } from "react-window";

import useClassListObserver from "./useClassListObserver";

type Measurements = {
  conditionalPointPanelHeight: number;
  pointPanelHeight: number;
  lineHeight: number;
  lineHeightWithPoint: number;
  lineHeightWithConditionalPoint: number;
};

const REGULAR_SIZE: Measurements = {
  conditionalPointPanelHeight: 130,
  pointPanelHeight: 90,
  lineHeight: 16,
  lineHeightWithPoint: 16 + 90,
  lineHeightWithConditionalPoint: 16 + 130,
};
const LARGE_SIZE: Measurements = {
  conditionalPointPanelHeight: 156,
  pointPanelHeight: 108,
  lineHeight: 17,
  lineHeightWithPoint: 17 + 108,
  lineHeightWithConditionalPoint: 17 + 156,
};

// HACK
// We could swap this out for something that lazily measures row height.
// There are only a small number of variations though, so this is more efficient.
export default function useFontBasedListMeasurents(listRef: RefObject<List>): Measurements {
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
