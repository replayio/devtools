import { ObjectId, PauseId } from "@replayio/protocol";
import {
  CSSProperties,
  ForwardedRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { ListOnItemsRenderedProps } from "react-window";

import { ElementsListData } from "replay-next/components/elements/ElementsListData";
import { NoContentFallback } from "replay-next/components/elements/NoContentFallback";
import { Item } from "replay-next/components/elements/types";
import { InlineErrorFallback } from "replay-next/components/errors/InlineErrorFallback";
import { LoadingProgressBar } from "replay-next/components/LoadingProgressBar";
import { GenericList } from "replay-next/components/windowing/GenericList";
import { useHorizontalScrollingListCssVariables } from "replay-next/components/windowing/hooks/useHorizontalScrollingListCssVariables";
import { useScrollSelectedListItemIntoView } from "replay-next/components/windowing/hooks/useScrollSelectedListItemIntoView";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { ElementsListItem, ElementsListItemData, ITEM_SIZE } from "./ElementsListItem";
import styles from "./ElementList.module.css";

export type ImperativeHandle = {
  selectIndex(index: number | null): Promise<void>;
  selectNode(nodeId: ObjectId | null): Promise<void>;
};

type OnSelectionChange = (id: ObjectId | null) => void;

export function ElementsList({
  height,
  forwardedRef,
  listData,
  onSelectionChange = null,
  pauseId,
}: {
  height: number;
  forwardedRef?: ForwardedRef<ImperativeHandle>;
  listData: ElementsListData;
  onSelectionChange?: OnSelectionChange | null;
  pauseId: PauseId;
}) {
  const replayClient = useContext(ReplayClientContext);

  const itemData = useMemo<ElementsListItemData>(
    () => ({
      pauseId,
      replayClient,
    }),
    [pauseId, replayClient]
  );

  const { cssVariables, onItemsRendered: onItemsRenderedOne } =
    useHorizontalScrollingListCssVariables("ElementsList");

  const onItemsRenderedTwo = useScrollSelectedListItemIntoView("ElementsList");

  const onItemsRendered = (props: ListOnItemsRenderedProps) => {
    onItemsRenderedOne();
    onItemsRenderedTwo(props);
  };

  // Convenience wrapper for onChange since the ListData class isn't exposed publicly in this case
  const onSelectionChangeRef = useRef<OnSelectionChange | null>(null);
  useLayoutEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  });
  useLayoutEffect(() => {
    return listData.subscribeToSelectedIndex((index: number | null) => {
      const onSelectionChange = onSelectionChangeRef.current;
      if (onSelectionChange) {
        const objectId = index != null ? listData.getItemAtIndex(index).objectId : null;
        onSelectionChange(objectId);
      }
    });
  }, [listData]);

  const didError = useSyncExternalStore(
    listData.subscribeToInvalidation,
    listData.didError,
    listData.didError
  );
  const isLoading = useSyncExternalStore(
    listData.subscribeToLoading,
    listData.getIsLoading,
    listData.getIsLoading
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      async selectIndex(index: number | null) {
        await listData.waitUntilLoaded();
        listData.setSelectedIndex(index);
      },

      async selectNode(nodeId: ObjectId | null) {
        await listData.waitUntilLoaded();
        listData.selectNode(nodeId);
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

  if (didError) {
    return <InlineErrorFallback style={{ height }} />;
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

        switch (item.displayMode) {
          case "collapsed":
          case "empty": {
            const parentItem = listData.getParentItem(item);
            const parentIndex = listData.getIndexForItem(parentItem);
            listData.setSelectedIndex(parentIndex);
            break;
          }
          case "head": {
            listData.toggleNodeExpanded(item.objectId, false);
            break;
          }
          case "tail": {
            listData.setSelectedIndex(listData.getIndexForItem(item));
            break;
          }
        }
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        event.stopPropagation();

        switch (item.displayMode) {
          case "collapsed": {
            listData.toggleNodeExpanded(item.objectId, true);
            break;
          }
          case "empty": {
            break;
          }
          case "head": {
            listData.setSelectedIndex(index + 1);
            break;
          }
          case "tail": {
            break;
          }
        }
        break;
      }
    }
  };

  return (
    <div className={styles.ListWrapper} style={{ height }}>
      {isLoading && <LoadingProgressBar />}
      <GenericList<Item, ElementsListItemData>
        className={styles.List}
        dataStatus={isLoading ? "loading" : "loaded"}
        dataTestId="ElementsList"
        fallbackForEmptyList={<NoContentFallback />}
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
    </div>
  );
}
