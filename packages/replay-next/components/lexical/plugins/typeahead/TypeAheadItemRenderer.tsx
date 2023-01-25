import { LexicalEditor } from "lexical";
import { ReactNode, useLayoutEffect, useRef } from "react";

import { INSERT_ITEM_COMMAND } from "replay-next/components/lexical/plugins/typeahead/commands";

import styles from "./styles.module.css";

export default function TypeAheadItemRenderer<Item>({
  className,
  dataTestId,
  dataTestName = "TypeAheadPopup-List-Item",
  editor,
  isSelected,
  item,
  itemRenderer,
  query,
}: {
  className: string;
  dataTestId?: string;
  dataTestName?: string;
  editor: LexicalEditor;
  isSelected: boolean;
  item: Item;
  itemRenderer: (item: Item, query: string) => ReactNode;
  query: string;
}) {
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

  const onClick = () => {
    editor.dispatchCommand(INSERT_ITEM_COMMAND, { item });
  };

  return (
    <div
      className={`${className} ${isSelected ? styles.SelectedItem : styles.Item}`}
      data-test-id={dataTestId}
      data-test-name={dataTestName}
      onClick={onClick}
      ref={ref}
    >
      {itemRenderer(item, query)}
    </div>
  );
}
