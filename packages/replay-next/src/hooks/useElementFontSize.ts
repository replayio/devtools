import { RefObject, useState } from "react";

import useClassListObserver from "./useClassListObserver";

export default function useElementFontSize(
  elementRef?: RefObject<HTMLElement>,
  defaultFontSize: number = 16
): number {
  const [size, setSize] = useState<number>(defaultFontSize);

  useClassListObserver(document.body.parentElement!, () => {
    const element = elementRef?.current ?? document.body;
    if (element) {
      const style = getComputedStyle(element);
      if (style.fontSize) {
        const size = parseInt(style.fontSize, 10);
        if (size !== size) {
          setSize(size);
        }
      }
    }
  });

  return size;
}
