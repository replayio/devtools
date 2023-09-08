import {
  ComponentType,
  ReactElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import { GenericListData } from "replay-next/components/windowing/GenericListData";

export type GenericListItemData<Item, ItemData> = {
  itemData: ItemData;
  listData: GenericListData<Item, ItemData>;
  selectedItemIndex: number | null;
  selectItemAtIndex: (index: number | null) => void;
};

// TODO Probably add useImperativeApi() to expose List API
export function GenericList<Item, ItemData extends Object>({
  className = "",
  dataTestId,
  dataTestName,
  fallbackForEmptyList,
  height,
  itemData,
  itemRendererComponent,
  itemSize,
  listDataImplementation,
  width,
}: {
  className?: string;
  dataTestId?: string;
  dataTestName?: string;
  fallbackForEmptyList?: ReactElement;
  height: number | string;
  itemData: ItemData;
  itemRendererComponent: ComponentType<
    ListChildComponentProps<GenericListItemData<Item, ItemData>>
  >;
  itemSize: number;
  listDataImplementation: new () => GenericListData<Item, ItemData>;
  width: number | string;
}) {
  const [selectedItemIndex, selectItemAtIndex] = useState<number | null>(null);

  const listDataRef = useRef<GenericListData<Item, ItemData>>(null);
  if (listDataRef.current === null) {
    // @ts-ignore
    listDataRef.current = new listDataImplementation();
  }

  const listData = listDataRef.current;
  listData.updateItemData(itemData);

  const itemCount = useSyncExternalStore(
    listData.subscribe,
    listData.getItemCount,
    listData.getItemCount
  );

  const listRef = useRef<List>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Not every list supports the concept of a selected row (e.g. Elements > Rules)
    // Follow the lead of the list and only add arrow key navigation once an item has been selected
    if (selectedItemIndex == null) {
      return;
    }

    const element = outerRef.current;
    const list = listRef.current;
    if (element && list) {
      const onKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case "ArrowDown": {
            event.preventDefault();
            if (selectedItemIndex < itemCount - 1) {
              selectItemAtIndex(selectedItemIndex + 1);
              list.scrollToItem(selectedItemIndex + 1, "smart");
            }
            break;
          }
          case "ArrowUp": {
            event.preventDefault();
            if (selectedItemIndex > 0) {
              selectItemAtIndex(selectedItemIndex - 1);
              list.scrollToItem(selectedItemIndex - 1, "smart");
            }
            break;
          }
        }
      };

      element.addEventListener("keydown", onKeyDown);
      return () => {
        element.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [itemCount, selectedItemIndex]);

  useLayoutEffect(() => {
    // react-window doesn't provide a way to declaratively set data-* attributes
    // but they're very useful for our e2e tests
    // We use an effect without dependencies to set these so that we'll always (re)set them after a render,
    // even if the name/id values haven't changed,
    // so that other declarative updates don't erase these values
    const element = outerRef.current;
    if (element) {
      if (dataTestId) {
        element.setAttribute("data-test-id", dataTestId);
      } else {
        element.removeAttribute("data-test-id");
      }

      if (dataTestName) {
        element.setAttribute("data-test-name", dataTestName);
      } else {
        element.removeAttribute("data-test-name");
      }
    }
  });

  const internalItemData = {
    itemData,
    listData,
    selectedItemIndex,
    selectItemAtIndex,
  };

  if (fallbackForEmptyList !== undefined) {
    if (itemCount === 0) {
      return fallbackForEmptyList;
    }
  }

  return (
    <List<GenericListItemData<Item, ItemData>>
      children={itemRendererComponent}
      className={className}
      height={height}
      itemCount={itemCount}
      itemData={internalItemData}
      itemSize={itemSize}
      outerRef={outerRef}
      ref={listRef}
      width={width}
    />
  );
}
