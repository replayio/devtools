import { useEffect, useState } from "react";

var resizeObserver;

// Set the element to be observed in the component's state, and pass it into this
// hook so that it returns the width of the element whenever it's resized.
export default function useWidthObserver(node: HTMLElement) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!node) return;

    resizeObserver = new ResizeObserver(() => {
      const newWidth = node.getBoundingClientRect().width;
      setWidth(newWidth);
    });

    resizeObserver.observe(node);
  }, [node]);

  return width;
}
