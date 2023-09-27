import { ObjectId, PauseId } from "@replayio/protocol";
import {
  CSSProperties,
  ForwardedRef,
  ReactElement,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { ListOnItemsRenderedProps } from "react-window";
import { useImperativeCacheValue } from "suspense";

import { ElementsListData } from "replay-next/components/elements/ElementsListData";
import { useElementsListCssVariables } from "replay-next/components/elements/hooks/useElementsListCssVariables";
import { useScrollSelectedElementIntoView } from "replay-next/components/elements/hooks/useScrollSelectedElementIntoView";
import { rootObjectIdCache } from "replay-next/components/elements/suspense/RootObjectIdCache";
import { Item } from "replay-next/components/elements/types";
import { DefaultFallback } from "replay-next/components/ErrorBoundary";
import {
  GenericList,
  ImperativeHandle as GenericListImperativeHandle,
} from "replay-next/components/windowing/GenericList";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { ElementsListItem, ElementsListItemData, ITEM_SIZE } from "./ElementsListItem";
import styles from "./ElementList.module.css";

export type ImperativeHandle = {
  selectNode(nodeId: ObjectId | null): Promise<void>;
};

export function ElementsList({
  height,
  forwardedRef,
  noContentFallback,
  onSelectionChange: onSelectionChangeProp,
  pauseId,
}: {
  height: number;
  forwardedRef?: ForwardedRef<ImperativeHandle>;
  noContentFallback?: ReactElement;
  onSelectionChange?: (id: ObjectId | null) => void;
  pauseId: PauseId;
}) {
  const replayClient = useContext(ReplayClientContext);

  const itemData = useMemo<ElementsListItemData>(() => ({}), []);

  const genericListRef = useRef<GenericListImperativeHandle>(null);

  const { cssVariables, onItemsRendered: onItemsRenderedOne } = useElementsListCssVariables();

  const onItemsRenderedTwo = useScrollSelectedElementIntoView();

  const onItemsRendered = (props: ListOnItemsRenderedProps) => {
    onItemsRenderedOne(props);
    onItemsRenderedTwo(props);
  };

  const { value: rootObjectId } = useImperativeCacheValue(rootObjectIdCache, replayClient, pauseId);

  const listData = useMemo<ElementsListData>(
    () => new ElementsListData(replayClient, pauseId),
    [pauseId, replayClient]
  );

  const didError = useSyncExternalStore(listData.subscribe, listData.didError, listData.didError);

  useImperativeHandle(
    forwardedRef,
    () => ({
      async selectNode(nodeId: ObjectId | null) {
        const genericList = genericListRef.current;
        if (genericList) {
          if (nodeId === null) {
            genericList.selectItemAtIndex(null);
          } else {
            const index = await listData.loadPathToNode(nodeId);
            if (index != null) {
              genericList.selectItemAtIndex(index);
            }
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
    const list = genericListRef.current;
    if (list == null) {
      return;
    }

    const index = list.selectedItemIndex;
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
          list.selectItemAtIndex(listData.getIndexForItem(item));
        } else if (hasChildren && item.isExpanded) {
          listData.toggleNodeExpanded(item.id, false);
        } else {
          const parentItem = listData.getParentItem(item);
          const parentIndex = listData.getIndexForItem(parentItem);
          list.selectItemAtIndex(parentIndex);
        }
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        event.stopPropagation();

        const hasChildren = item.element.filteredChildNodeIds.length > 0;
        if (hasChildren) {
          if (item.isExpanded) {
            list.selectItemAtIndex(index + 1);
          } else {
            listData.toggleNodeExpanded(item.id, true);
          }
        }
        break;
      }
    }
  };

  const onSelectionChange = (index: number | null) => {
    if (onSelectionChangeProp) {
      const item = index != null ? listData.getItemAtIndex(index).id : null;
      onSelectionChangeProp(item);
    }
  };

  return (
    <GenericList<Item, ElementsListItemData>
      className={styles.List}
      dataTestId="ElementsList"
      defaultSelectedIndex={0}
      fallbackForEmptyList={noContentFallback}
      forwardedRef={genericListRef}
      height={height}
      itemData={itemData}
      itemRendererComponent={ElementsListItem}
      itemSize={ITEM_SIZE}
      listData={listData}
      onItemsRendered={onItemsRendered}
      onKeyDown={onKeyDown}
      onSelectionChange={onSelectionChange}
      style={cssVariables as CSSProperties}
      width="100%"
    />
  );
}
