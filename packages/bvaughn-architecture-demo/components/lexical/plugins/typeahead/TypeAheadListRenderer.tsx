import { LexicalEditor } from "lexical";
import { ReactNode, RefObject } from "react";

import TypeAheadItemRenderer from "./TypeAheadItemRenderer";
import styles from "./styles.module.css";

// TODO Use react-window to render list?
export default function TypeAheadListRenderer<Item>({
  dataTestId,
  dataTestName = "TypeAheadPopup-List",
  editor,
  itemClassName,
  items,
  itemRenderer,
  listClassName,
  popupRef,
  query,
  selectedItem,
}: {
  dataTestId?: string;
  dataTestName?: string;
  editor: LexicalEditor;
  itemClassName: string;
  itemRenderer: (item: Item, query: string) => ReactNode;
  items: Item[];
  listClassName: string;
  popupRef: RefObject<HTMLDivElement>;
  query: string;
  selectedItem: Item | null;
}) {
  return (
    <div
      className={`${listClassName} ${styles.List}`}
      data-test-id={dataTestId}
      data-test-name={dataTestName}
      ref={popupRef}
    >
      {items.map((item, index) => (
        <TypeAheadItemRenderer
          dataTestId={dataTestId ? `${dataTestId}-Item-${index}` : undefined}
          dataTestName={dataTestName ? `${dataTestName}-Item` : undefined}
          className={itemClassName}
          editor={editor}
          key={index}
          isSelected={selectedItem === items[index]}
          item={item as Item}
          itemRenderer={itemRenderer}
          query={query}
        />
      ))}
    </div>
  );
}
