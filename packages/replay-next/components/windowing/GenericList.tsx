import {
  CSSProperties,
  ComponentType,
  ReactElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  FixedSizeList as List,
  ListChildComponentProps,
  ListOnItemsRenderedProps,
} from "react-window";

import { GenericListData } from "replay-next/components/windowing/GenericListData";

export type GenericListItemData<Item, ItemData> = {
  itemData: ItemData;
  listData: GenericListData<Item>;
  // Not required by list items but ensures a re-render when the underlying data is invalidated
  revision: number;
  selectedItemIndex: number | null;
};

export type ImperativeHandle = {
  selectedItemIndex: number | null;
  selectItemAtIndex: (index: number | null) => void;
};

export function GenericList<Item, ItemData extends Object>({
  className = "",
  dataStatus,
  dataTestId,
  dataTestName,
  fallbackForEmptyList,
  height,
  itemData,
  itemRendererComponent,
  itemSize,
  listData,
  onItemsRendered,
  onKeyDown: onKeyDownProp,
  onMouseMove: onMouseMoveProp,
  style,
  width,
}: {
  className?: string;
  dataStatus?: string;
  dataTestId?: string;
  dataTestName?: string;
  fallbackForEmptyList?: ReactElement;
  height: number;
  itemData: ItemData;
  itemRendererComponent: ComponentType<
    ListChildComponentProps<GenericListItemData<Item, ItemData>>
  >;
  itemSize: number;
  listData: GenericListData<Item>;
  onItemsRendered?: (props: ListOnItemsRenderedProps) => any;
  onKeyDown?: (event: KeyboardEvent) => void;
  onMouseMove?: (event: MouseEvent) => void;
  style?: CSSProperties;
  width: number | string;
}) {
  // The store may be invalidated in ways that don't affect the item count,
  // so we need to subscribe to more than just the item count.
  const isLoading = useSyncExternalStore(
    listData.subscribeToLoading,
    listData.getIsLoading,
    listData.getIsLoading
  );
  const itemCount = useSyncExternalStore(
    listData.subscribeToInvalidation,
    listData.getItemCount,
    listData.getItemCount
  );
  const selectedItemIndex = useSyncExternalStore(
    listData.subscribeToSelectedIndex,
    listData.getSelectedIndex,
    listData.getSelectedIndex
  );
  const revision = useSyncExternalStore(
    listData.subscribeToInvalidation,
    listData.getRevision,
    listData.getRevision
  );

  const didMountRef = useRef(false);
  const listRef = useRef<List>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list && selectedItemIndex != null) {
      list.scrollToItem(selectedItemIndex, "smart");
    }
  }, [selectedItemIndex]);

  useLayoutEffect(() => {
    if (didMountRef.current) {
      return;
    }

    if (selectedItemIndex != null && itemCount > selectedItemIndex) {
      didMountRef.current = true;
    }
  }, [selectedItemIndex, itemCount]);

  useEffect(() => {
    const element = outerRef.current;
    if (element) {
      if (!onMouseMoveProp) {
        return;
      }

      const onMouseMove = (event: MouseEvent) => {
        onMouseMoveProp(event);
      };

      element.addEventListener("mousemove", onMouseMove);
      return () => {
        element.removeEventListener("mousemove", onMouseMove);
      };
    }
  }, [onMouseMoveProp]);

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

            const newSelectedItemIndex = Math.min(selectedItemIndex + 1, itemCount - 1);
            if (selectedItemIndex !== newSelectedItemIndex) {
              listData.setSelectedIndex(newSelectedItemIndex);
            }
            break;
          }
          case "ArrowUp": {
            event.preventDefault();

            const newSelectedItemIndex = Math.max(selectedItemIndex - 1, 0);
            if (selectedItemIndex !== newSelectedItemIndex) {
              listData.setSelectedIndex(newSelectedItemIndex);
            }
            break;
          }
          case "PageDown": {
            event.preventDefault();

            const newSelectedItemIndex = Math.min(selectedItemIndex + 10, itemCount - 1);
            if (selectedItemIndex !== newSelectedItemIndex) {
              listData.setSelectedIndex(newSelectedItemIndex);
            }
            break;
          }
          case "PageUp": {
            event.preventDefault();

            const newSelectedItemIndex = Math.max(selectedItemIndex - 10, 0);
            if (selectedItemIndex !== newSelectedItemIndex) {
              listData.setSelectedIndex(newSelectedItemIndex);
            }
            break;
          }
        }

        if (onKeyDownProp) {
          onKeyDownProp(event);
        }
      };

      element.addEventListener("keydown", onKeyDown);
      return () => {
        element.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [itemCount, listData, onKeyDownProp, selectedItemIndex]);

  useLayoutEffect(() => {
    const element = outerRef.current;
    if (element) {
      element.tabIndex = 0;

      // react-window doesn't provide a way to declaratively set data-* attributes but they're very useful for our e2e tests
      // Note that an effect is a better fit than the outerElementType because the latter causes a full unmount and remount on change
      if (dataStatus !== undefined) {
        element.setAttribute("data-status", dataStatus);
      }
      if (dataTestId !== undefined) {
        element.setAttribute("data-test-id", dataTestId);
      }
      if (dataTestName !== undefined) {
        element.setAttribute("data-test-name", dataTestName);
      }
    }
  });

  if (fallbackForEmptyList !== undefined) {
    if (!isLoading && itemCount === 0) {
      return fallbackForEmptyList;
    }
  }

  return (
    <List<GenericListItemData<Item, ItemData>>
      children={itemRendererComponent}
      className={className}
      height={height}
      itemCount={itemCount}
      itemData={{
        itemData,
        listData,
        revision,
        selectedItemIndex,
      }}
      itemSize={itemSize}
      onItemsRendered={onItemsRendered}
      outerRef={outerRef}
      ref={listRef}
      style={style}
      width={width}
    />
  );
}
