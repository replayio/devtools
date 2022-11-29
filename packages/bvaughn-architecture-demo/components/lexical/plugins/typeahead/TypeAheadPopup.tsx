import { LexicalEditor } from "lexical";
import * as React from "react";
import { FunctionComponent, useLayoutEffect, useRef } from "react";

import DefaultTypeAheadItemListRenderer from "./DefaultTypeAheadItemListRenderer";
import { ItemListRendererProps } from "./types";
import useTypeAheadPlugin from "./useTypeAheadPlugin";
import getDOMRangeRect from "./utils/getDOMRangeRect";
import getLexicalEditorForDomNode from "./utils/getLexicalEditorForDomNode";
import setFloatingElemPosition from "./utils/setFloatingElemPosition";

export default function TypeAheadPopUp<Item>({
  anchorElem,
  editor,
  insertItem,
  ItemListRenderer = DefaultTypeAheadItemListRenderer,
}: {
  anchorElem: HTMLElement;
  editor: LexicalEditor;
  insertItem: (item: Item) => void;
  ItemListRenderer: FunctionComponent<ItemListRendererProps<Item>>;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const { dismiss, items, query, selectedItem } = useTypeAheadPlugin<Item>();

  // Position popup
  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (popup === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    const nativeSelection = window.getSelection();
    if (nativeSelection === null || rootElement === null) {
      return;
    }

    const { anchorNode, anchorOffset, focusNode, focusOffset } = nativeSelection;
    if (anchorNode === null || focusNode === null) {
      return;
    }

    if (getLexicalEditorForDomNode(anchorNode) !== editor) {
      return;
    }

    let positionRect: DOMRect | null = null;

    // Position the popup at the start of the query.
    let queryLength = query.length;
    let currentNode: Node | null = anchorNode;
    let currentOffset = anchorOffset;
    loop: while (currentNode != null) {
      for (let offset = currentOffset; offset >= 0; offset--) {
        queryLength--;

        if (queryLength === 0) {
          // Temporarily change selection so we can measure the text we care about
          nativeSelection.setBaseAndExtent(currentNode, offset, currentNode, offset);

          positionRect = getDOMRangeRect(nativeSelection, rootElement);

          // Restore selection
          nativeSelection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);

          break loop;
        }
      }

      if (currentNode.previousSibling != null) {
        currentNode = currentNode.previousSibling;
        currentOffset = currentNode.textContent?.length ?? 0;
      } else if (currentNode.parentNode?.previousSibling?.firstChild != null) {
        currentNode = currentNode.parentNode.previousSibling.firstChild;
        currentOffset = currentNode.textContent?.length ?? 0;
      } else {
        currentNode = null;
      }
    }

    // const positionRect = positionRange?.getBoundingClientRect() ?? null;
    if (positionRect !== null) {
      popup.style.position = "absolute";
      popup.style.left = "0px";
      popup.style.top = "0px";

      setFloatingElemPosition(positionRect, popup, anchorElem, 0, 0);
    }
  });

  // Scroll selected item into view
  useLayoutEffect(() => {
    const itemRenderer = selectedItemRef.current;
    if (itemRenderer) {
      itemRenderer.scrollIntoView({ block: "nearest" });
    }
  });

  return (
    <ItemListRenderer
      items={items}
      popupRef={popupRef}
      selectItem={item => {
        insertItem(item);
      }}
      selectedItem={selectedItem}
    />
  );
}
