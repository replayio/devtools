import * as React from "react";

import { ItemListRendererProps } from "../typeahead/types";
import CodeCompletionItemRenderer from "./CodeCompletionItemRenderer";
import { Match } from "./types";
import "./styles.css";

export default function CodeCompletionItemListRenderer({
  items,
  popupRef,
  selectedItem,
  selectItem,
}: ItemListRendererProps<Match>) {
  return (
    <div className="code-completion-popup" ref={popupRef}>
      {items.map((item, index) => (
        <CodeCompletionItemRenderer
          key={index}
          isSelected={selectedItem === items[index]}
          item={item as Match}
          selectItem={selectItem}
        />
      ))}
    </div>
  );
}
