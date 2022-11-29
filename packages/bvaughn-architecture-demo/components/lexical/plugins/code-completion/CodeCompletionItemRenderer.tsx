import * as React from "react";
import { useLayoutEffect, useRef } from "react";

import { ItemRendererProps } from "../typeahead/types";
import { Match } from "./types";
import "./styles.css";

export default function CodeCompletionItemRenderer({
  isSelected,
  item,
  selectItem,
}: ItemRendererProps<Match>) {
  const ref = useRef<HTMLDivElement>(null);

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
      className={isSelected ? "code-completion-item-selected" : "code-completion-item"}
      onClick={onClick}
      ref={ref}
    >
      {item.text}
    </div>
  );
}
