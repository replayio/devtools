import { useRef } from "react";
import { ListOnItemsRenderedProps } from "react-window";

export function useScrollSelectedElementIntoView() {
  const lastRenderedItemsRef = useRef<[startIndex: number, stopIndex: number]>([-1, -1]);
  const lastSelectedIndexRef = useRef<number | null>(null);

  return ({
    visibleStartIndex: startIndex,
    visibleStopIndex: stopIndex,
  }: ListOnItemsRenderedProps) => {
    const list = document.querySelector('[data-test-id="ElementsList"]');
    if (list) {
      const selectedRow = list.querySelector("[data-selected]");
      if (selectedRow) {
        const selectedIndexString = selectedRow.getAttribute("data-list-index");
        if (selectedIndexString) {
          const selectedIndex = parseInt(selectedIndexString);
          if (lastSelectedIndexRef.current !== selectedIndex) {
            lastSelectedIndexRef.current = selectedIndex;

            const [prevStartIndex, prevStopIndex] = lastRenderedItemsRef.current;
            if (prevStartIndex > selectedIndex || prevStopIndex < selectedIndex) {
              const style = getComputedStyle(selectedRow);
              const offset = parseFloat(style.getPropertyValue("padding-left"));

              list.scrollLeft = offset;
            }
          }
        }
      }
    }

    lastRenderedItemsRef.current = [startIndex, stopIndex];
  };
}
