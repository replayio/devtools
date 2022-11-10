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
  conditionalPointPanelHeight: 138,
  pointPanelHeight: 94,
  lineHeight: 15,
  lineHeightWithPoint: 15 + 94,
  lineHeightWithConditionalPoint: 15 + 138,
};
const LARGE_SIZE: Measurements = {
  conditionalPointPanelHeight: 162,
  pointPanelHeight: 111,
  lineHeight: 16,
  lineHeightWithPoint: 16 + 111,
  lineHeightWithConditionalPoint: 16 + 162,
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
