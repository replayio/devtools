import { ObjectId, PauseId } from "@replayio/protocol";
import {
  CSSProperties,
  ForwardedRef,
  ReactElement,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { ListOnItemsRenderedProps } from "react-window";
import { useImperativeCacheValue } from "suspense";

import { ElementsListData } from "replay-next/components/elements/ElementsListData";
import { rootObjectIdCache } from "replay-next/components/elements/suspense/RootObjectIdCache";
import { Item } from "replay-next/components/elements/types";
import { DefaultFallback } from "replay-next/components/ErrorBoundary";
import { GenericList } from "replay-next/components/windowing/GenericList";
import { useHorizontalScrollingListCssVariables } from "replay-next/components/windowing/hooks/useHorizontalScrollingListCssVariables";
import { useScrollSelectedListItemIntoView } from "replay-next/components/windowing/hooks/useScrollSelectedListItemIntoView";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { ElementsListItem, ElementsListItemData, ITEM_SIZE } from "./ElementsListItem";
import styles from "./ElementList.module.css";

export type ImperativeHandle = {
  selectNode(nodeId: ObjectId | null): Promise<void>;
};

type OnSelectionChange = (id: ObjectId | null) => void;

export function ElementsList({
  height,
  forwardedRef,
  noContentFallback,
  onSelectionChange = null,
  pauseId,
}: {
  height: number;
  forwardedRef?: ForwardedRef<ImperativeHandle>;
  noContentFallback?: ReactElement;
  onSelectionChange?: OnSelectionChange | null;
  pauseId: PauseId;
}) {
  const replayClient = useContext(ReplayClientContext);

  const itemData = useMemo<ElementsListItemData>(() => ({}), []);

  const { cssVariables, onItemsRendered: onItemsRenderedOne } =
    useHorizontalScrollingListCssVariables("ElementsList");

  const onItemsRenderedTwo = useScrollSelectedListItemIntoView("ElementsList");

  const onItemsRendered = (props: ListOnItemsRenderedProps) => {
    onItemsRenderedOne();
    onItemsRenderedTwo(props);
  };

  const { value: rootObjectId } = useImperativeCacheValue(rootObjectIdCache, replayClient, pauseId);

  const listData = useMemo<ElementsListData>(
    () => new ElementsListData(replayClient, pauseId),
    [pauseId, replayClient]
  );

  // Convenience wrapper for onChange since the ListData class isn't exposed publicly in this case
  const onSelectionChangeRef = useRef<OnSelectionChange | null>(null);
  useLayoutEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  });
  useLayoutEffect(() => {
    return listData.subscribeToSelectedIndex((index: number | null) => {
      const onSelectionChange = onSelectionChangeRef.current;
      if (onSelectionChange) {
        const item = index != null ? listData.getItemAtIndex(index).id : null;
        onSelectionChange(item);
      }
    });
  }, [listData]);

  const didError = useSyncExternalStore(
    listData.subscribeToInvalidation,
    listData.didError,
    listData.didError
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      async selectNode(nodeId: ObjectId | null) {
        if (nodeId === null) {
          listData.setSelectedIndex(null);
        } else {
          const index = await listData.loadPathToNode(nodeId);
          if (index != null) {
            listData.setSelectedIndex(index);
          }
        }
      },
    }),
    [listData]
  );

  useEffect(() => {
    listData.activate();
    return () => {
      listData.destroy();
    };
  }, [listData]);

  useEffect(() => {
    if (rootObjectId) {
      listData.registerRootNodeId(rootObjectId);
    }
  }, [listData, rootObjectId]);

  if (didError) {
    return <DefaultFallback style={{ height }} />;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const index = listData.getSelectedIndex();
    if (index == null) {
      return;
    }

    const item = listData.getItemAtIndex(index);
    switch (event.key) {
      case "ArrowLeft": {
        event.preventDefault();
        event.stopPropagation();

        const hasChildren = item.element.filteredChildNodeIds.length > 0;
        if (item.isTail) {
          listData.setSelectedIndex(listData.getIndexForItem(item));
        } else if (hasChildren && item.isExpanded) {
          listData.toggleNodeExpanded(item.id, false);
        } else {
          const parentItem = listData.getParentItem(item);
          const parentIndex = listData.getIndexForItem(parentItem);
          listData.setSelectedIndex(parentIndex);
        }
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        event.stopPropagation();

        const hasChildren = item.element.filteredChildNodeIds.length > 0;
        if (hasChildren) {
          if (item.isExpanded) {
            listData.setSelectedIndex(index + 1);
          } else {
            listData.toggleNodeExpanded(item.id, true);
          }
        }
        break;
      }
    }
  };

  return (
    <GenericList<Item, ElementsListItemData>
      className={styles.List}
      dataTestId="ElementsList"
      fallbackForEmptyList={noContentFallback}
      height={height}
      itemData={itemData}
      itemRendererComponent={ElementsListItem}
      itemSize={ITEM_SIZE}
      listData={listData}
      onItemsRendered={onItemsRendered}
      onKeyDown={onKeyDown}
      style={cssVariables as CSSProperties}
      width="100%"
    />
  );
}
