import * as React from "react";
import { useLayoutEffect, useRef } from "react";

import { ItemRendererProps } from "../typeahead/types";
import { TeamMember } from "./types";
import "./styles.css";

export default function MentionsItemRenderer({
  isSelected,
  item,
  selectItem,
}: ItemRendererProps<TeamMember>) {
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
      className={isSelected ? "mentions-item-selected" : "mentions-item"}
      onClick={onClick}
      ref={ref}
    >
      {item.name} <small>({item.username})</small>
    </div>
  );
}
