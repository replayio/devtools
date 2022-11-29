import { useLayoutEffect, useRef } from "react";

import { ItemRendererProps } from "./types";

export default function DefaultTypeAheadItemRenderer<Item>({
  isSelected,
  item,
  selectItem,
}: ItemRendererProps<Item>) {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll selected items into view
  useLayoutEffect(() => {
    if (isSelected) {
      const element = ref.current;
      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isSelected]);

  const onClick = () => selectItem(item);

  return (
    <div
      className={isSelected ? "type-ahead-item-selected" : "type-ahead-item"}
      onClick={onClick}
      ref={ref}
    >
      {item as any}
    </div>
  );
}
