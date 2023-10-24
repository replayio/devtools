import {
  CSSProperties,
  ComponentType,
  ForwardedRef,
  LegacyRef,
  ReactElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
  selectedItemIndex: number | null;
  selectItemAtIndex: (index: number | null) => void;
};

export type ImperativeHandle = {
  selectedItemIndex: number | null;
  selectItemAtIndex: (index: number | null) => void;
};

export function GenericList<Item, ItemData extends Object>({
  className = "",
  dataTestId,
  dataTestName,
  defaultSelectedIndex = null,
  fallbackForEmptyList,
  forwardedRef,
  height,
  itemData,
  itemRendererComponent,
  itemSize,
  listData,
  onItemsRendered,
  onKeyDown: onKeyDownProp,
  onMouseMove: onMouseMoveProp,
  onSelectionChange,
  style,
  width,
}: {
  className?: string;
  dataTestId?: string;
  dataTestName?: string;
  defaultSelectedIndex?: number | null;
  fallbackForEmptyList?: ReactElement;
  forwardedRef?: ForwardedRef<ImperativeHandle>;
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
  onSelectionChange?: (index: number | null) => void;
  style?: CSSProperties;
  width: number | string;
}) {
  const [selectedItemIndex, selectItemAtIndex] = useState<number | null>(defaultSelectedIndex);

  const selectItemAtIndexWrapper = useCallback((index: number | null) => {
    selectItemAtIndex(index);

    const onSelectionChange = committedValuesRef.current.onSelectionChange;
    if (onSelectionChange) {
      onSelectionChange(index);
    }
  }, []);

  // The store may be invalidated in ways that don't affect the item count,
  // so we need to subscribe to more than just the item count.
  const itemCount = useSyncExternalStore(
    listData.subscribe,
    listData.getItemCount,
    listData.getItemCount
  );
  const revision = useSyncExternalStore(
    listData.subscribe,
    listData.getRevision,
    listData.getRevision
  );

  if (selectedItemIndex != null && itemCount > 0 && selectedItemIndex >= itemCount) {
    selectItemAtIndex(itemCount - 1);
  }

  const committedValuesRef = useRef<{
    onSelectionChange: ((index: number | null) => void) | undefined;
  }>({
    onSelectionChange,
  });
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
    committedValuesRef.current.onSelectionChange = onSelectionChange;
  });

  useLayoutEffect(() => {
    if (didMountRef.current) {
      return;
    }

    if (defaultSelectedIndex != null && itemCount > defaultSelectedIndex) {
      didMountRef.current = true;

      const onSelectionChange = committedValuesRef.current.onSelectionChange;
      if (onSelectionChange) {
        onSelectionChange(defaultSelectedIndex);
      }
    }
  }, [defaultSelectedIndex, itemCount]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      selectedItemIndex,
      selectItemAtIndex: selectItemAtIndexWrapper,
    }),
    [selectedItemIndex, selectItemAtIndexWrapper]
  );

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
            if (selectedItemIndex < itemCount - 1) {
              selectItemAtIndexWrapper(selectedItemIndex + 1);
            }
            break;
          }
          case "ArrowUp": {
            event.preventDefault();
            if (selectedItemIndex > 0) {
              selectItemAtIndexWrapper(selectedItemIndex - 1);
            }
            break;
          }
          default: {
            if (onKeyDownProp) {
              onKeyDownProp(event);
            }
          }
        }
      };

      element.addEventListener("keydown", onKeyDown);
      return () => {
        element.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [itemCount, onKeyDownProp, selectedItemIndex, selectItemAtIndexWrapper]);

  const internalItemData = {
    itemData,
    listData,
    revision,
    selectedItemIndex,
    selectItemAtIndex: selectItemAtIndexWrapper,
  };

  // react-window doesn't provide a way to declaratively set data-* attributes
  // but they're very useful for our e2e tests
  const OuterElement = useMemo(() => {
    return forwardRef(function OuterElement(props, forwardedRef: LegacyRef<HTMLDivElement>) {
      return (
        <div
          ref={forwardedRef}
          data-test-id={dataTestId}
          data-test-name={dataTestName}
          tabIndex={0}
          {...props}
        />
      );
    });
  }, [dataTestId, dataTestName]);

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
      onItemsRendered={onItemsRendered}
      outerRef={outerRef}
      outerElementType={OuterElement}
      ref={listRef}
      style={style}
      width={width}
    />
  );
}
