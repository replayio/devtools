import { mergeRegister } from "@lexical/utils";
import { captureException } from "@sentry/react";
import {
  BLUR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  LexicalEditor,
} from "lexical";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { isPromiseLike } from "suspense";

import { INSERT_ITEM_COMMAND } from "./commands";
import TypeAheadListRenderer from "./TypeAheadListRenderer";
import { QueryData } from "./types";
import getDOMRangeRect from "./utils/getDOMRangeRect";
import getLexicalEditorForDomNode from "./utils/getLexicalEditorForDomNode";
import setFloatingElemPosition from "./utils/setFloatingElemPosition";

const EMPTY_ARRAY: any[] = [];

export default function TypeAheadPopUpSuspends<Item>({
  anchorElem,
  dataTestId,
  dataTestName,
  editor,
  findMatches,
  isExactMatch,
  itemClassName,
  itemRenderer,
  listClassName,
  queryData,
  updateQueryData,
}: {
  anchorElem: HTMLElement;
  dataTestId?: string;
  dataTestName?: string;
  editor: LexicalEditor;
  findMatches: (query: string, queryAdditionalData: string | null) => Item[];
  isExactMatch: (query: string, item: Item) => boolean;
  itemClassName: string;
  itemRenderer: (item: Item, query: string) => ReactNode;
  listClassName: string;
  queryData: QueryData;
  updateQueryData: (queryData: QueryData | null) => void;
}) {
  let items: Item[] = [];
  try {
    items = findMatches(queryData.query, queryData.queryAdditionalData);
  } catch (errorOrPromise) {
    if (isPromiseLike(errorOrPromise)) {
      throw errorOrPromise;
    }
    console.error("Failed to find matches for the TypeAheadPopup", errorOrPromise);
    captureException(errorOrPromise);
  }

  return (
    <TypeAheadPopUp
      anchorElem={anchorElem}
      dataTestId={dataTestId}
      dataTestName={dataTestName}
      editor={editor}
      isExactMatch={isExactMatch}
      itemClassName={itemClassName}
      itemRenderer={itemRenderer}
      items={items}
      listClassName={listClassName}
      queryData={queryData}
      updateQueryData={updateQueryData}
    />
  );
}

function TypeAheadPopUp<Item>({
  anchorElem,
  dataTestId,
  dataTestName,
  editor,
  isExactMatch,
  itemClassName,
  itemRenderer,
  items,
  listClassName,
  queryData,
  updateQueryData,
}: {
  anchorElem: HTMLElement;
  dataTestId?: string;
  dataTestName?: string;
  editor: LexicalEditor;
  isExactMatch: (query: string, item: Item) => boolean;
  itemClassName: string;
  itemRenderer: (item: Item, query: string) => ReactNode;
  items: Item[];
  listClassName: string;
  queryData: QueryData;
  updateQueryData: (queryData: QueryData | null) => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Refines selected item when items change.
  const [prevState, setPrevState] = useState({
    items: EMPTY_ARRAY,
    selectedIndex: 0,
  });
  if (prevState.items !== items) {
    const { items: prevItems, selectedIndex: prevSelectedIndex } = prevState;

    const previousItem = prevSelectedIndex < prevItems.length ? prevItems[prevSelectedIndex] : null;

    // Only maintain selection if the selected index is greater than 0.
    // This avoids awkward scroll jumps while the user is typing.
    let newSelectionIndex = 0;
    if (previousItem !== null && prevSelectedIndex > 0) {
      newSelectionIndex = items.indexOf(previousItem);
      newSelectionIndex = newSelectionIndex >= 0 ? newSelectionIndex : 0;
    }

    setSelectedIndex(newSelectionIndex);

    setPrevState({
      items,
      selectedIndex: newSelectionIndex,
    });
  } else if (prevState.selectedIndex !== selectedIndex) {
    setPrevState({
      items,
      selectedIndex,
    });
  }

  // Notify the parent plug-in that it should deactivate the type-ahead when there are no suggestions.
  // This includes the case where there's only one suggestion and it's an exact match.
  //
  // It's best to do this with a layout effect because of the exact-match check;
  // Otherwise the popup will appear to flicker before being hidden.
  useLayoutEffect(() => {
    if (queryData !== null) {
      if (items.length === 0) {
        updateQueryData(null);
      } else if (items.length === 1 && isExactMatch(queryData.query, items[0])) {
        updateQueryData(null);
      }
    }
  }, [isExactMatch, items, queryData, updateQueryData]);

  // Shares most recently committed component state with imperative Lexical API (which only runs on mount)
  const committedStateRef = useRef({
    items,
    queryData,
    selectedIndex,
    updateQueryData,
  });
  useLayoutEffect(() => {
    committedStateRef.current.items = items;
    committedStateRef.current.queryData = queryData;
    committedStateRef.current.selectedIndex = selectedIndex;
    committedStateRef.current.updateQueryData = updateQueryData;
  });

  const selectedItem = items[selectedIndex] || null;

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
    } else if (getLexicalEditorForDomNode(anchorNode) !== editor) {
      return;
    }

    const { beginOffset, beginTextNode, endOffset, endTextNode } = queryData.textRange;

    try {
      const beginHTMLElement = editor.getElementByKey(beginTextNode.getKey());
      const endHTMLElement = editor.getElementByKey(endTextNode.getKey());

      if (beginHTMLElement && endHTMLElement) {
        const beginTextNode =
          beginHTMLElement.nodeType === Node.TEXT_NODE
            ? beginHTMLElement
            : beginHTMLElement.firstChild!;
        const endTextNode =
          endHTMLElement.nodeType === Node.TEXT_NODE ? endHTMLElement : endHTMLElement.firstChild!;

        const endTextNodeOffset = Math.min(
          endOffset,
          endTextNode.textContent ? endTextNode.textContent.length : 0
        );

        // Position the popup at the start of the query.
        // Temporarily change selection so we can measure the text we care about
        nativeSelection.setBaseAndExtent(
          beginTextNode,
          beginOffset,
          endTextNode,
          endTextNodeOffset
        );

        const positionRect = getDOMRangeRect(nativeSelection, rootElement);

        // const positionRect = positionRange?.getBoundingClientRect() ?? null;
        if (positionRect !== null) {
          popup.style.position = "absolute";
          popup.style.left = "0px";
          popup.style.top = "0px";

          setFloatingElemPosition(positionRect, popup, anchorElem, 0, 0);
        }
      }
    } catch (error) {
      console.error(error);
    }

    // Restore selection
    nativeSelection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
  });

  // Scroll selected item into view
  useLayoutEffect(() => {
    const selectedItem = selectedItemRef.current;
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  });

  // Clicks inside of the popup shouldn't dismiss the plugin
  // until after they have been handled.
  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (popup) {
      const onMouseDown = (event: MouseEvent) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      };

      popup.addEventListener("mousedown", onMouseDown);
      return () => {
        popup.removeEventListener("mousedown", onMouseDown);
      };
    }
  }, []);

  // Register Lexical command listeners for mouse and keyboard interactions
  useLayoutEffect(() => {
    function onKeyPress(event: KeyboardEvent) {
      if (event.shiftKey) {
        // Edge case but SHIFT+TAB should not accept a suggestion
        return true;
      }

      if (!editor.isEditable()) {
        return false;
      }

      const { queryData } = committedStateRef.current;
      if (queryData === null) {
        return false;
      }

      switch (event.key) {
        case "ArrowDown": {
          const { items, selectedIndex } = committedStateRef.current;
          if (items.length === 0) {
            return false;
          }

          event.preventDefault();

          let newIndex = selectedIndex + 1;
          if (newIndex >= items.length) {
            newIndex = 0;
          }

          setSelectedIndex(newIndex);

          return true;
        }
        case "ArrowUp": {
          const { items, selectedIndex } = committedStateRef.current;
          if (items.length === 0) {
            return false;
          }

          event.preventDefault();

          let newIndex = selectedIndex - 1;
          if (newIndex < 0) {
            newIndex = items.length - 1;
          }

          setSelectedIndex(newIndex);

          return true;
        }
        case "Enter":
        case "NumpadEnter":
        case "Tab": {
          const { selectedIndex, items } = committedStateRef.current;
          const selectedItem = items[selectedIndex];
          if (selectedItem == null) {
            return false;
          }

          event.preventDefault();

          editor.dispatchCommand(INSERT_ITEM_COMMAND, { item: selectedItem as Item });

          return true;
        }
        case "Escape": {
          event.preventDefault();

          const { updateQueryData } = committedStateRef.current;
          updateQueryData(null);

          return true;
        }
      }

      return false;
    }

    // Dismiss the type-ahead popup on blur.
    function onBlur(event: FocusEvent) {
      // The only exception to this should be if the "blur" was caused by a click in the type-ahead menu.
      const popup = popupRef.current;
      if (popup) {
        const relatedTarget = event.relatedTarget as Node;
        if (popup !== relatedTarget && !popup.contains(relatedTarget)) {
          const { updateQueryData } = committedStateRef.current;
          updateQueryData(null);
          return false;
        }
      }

      return true;
    }

    return mergeRegister(
      editor.registerCommand(BLUR_COMMAND, onBlur, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, onKeyPress, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, onKeyPress, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ENTER_COMMAND, onKeyPress, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onKeyPress, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_TAB_COMMAND, onKeyPress, COMMAND_PRIORITY_HIGH)
    );
  }, [editor]);

  if (items.length === 0) {
    // Don't render an empty popup.
    return null;
  }

  return (
    <TypeAheadListRenderer
      dataTestId={dataTestId}
      dataTestName={dataTestName}
      editor={editor}
      itemClassName={itemClassName}
      itemRenderer={itemRenderer}
      listClassName={listClassName}
      items={items}
      popupRef={popupRef}
      query={queryData.query}
      selectedItem={selectedItem}
    />
  );
}
