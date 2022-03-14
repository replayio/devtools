import { useEffect, useState, RefObject } from "react";

var resizeObserver;

// Set the element to be observed in the component's state, and pass it into this
// hook so that it returns the width of the element whenever it's resized.
export default function useWidthObserver(node: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (node?.current === null) {
      return;
    }

    resizeObserver = new ResizeObserver(() => {
      if (node?.current === null) {
        return;
      }
      const newWidth = node.current.getBoundingClientRect().width;
      setWidth(newWidth);
    });

    resizeObserver.observe(node.current);
  }, [node]);

  return width;
}
