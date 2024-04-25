import { request } from "http";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";

import { NetworkMonitorListHeader } from "ui/components/NetworkMonitor/NetworkMonitorListHeader";
import {
  ItemData,
  LIST_ROW_HEIGHT,
  NetworkMonitorListRow,
} from "ui/components/NetworkMonitor/NetworkMonitorListRow";
import { useNetworkMonitorColumns } from "ui/components/NetworkMonitor/useNetworkMonitorColumns";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";

import styles from "./NetworkMonitorList.module.css";

export function NetworkMonitorList({
  currentTime,
  filteredAfterCount,
  filteredBeforeCount,
  requests,
  seekToRequest,
  selectedRequestId,
  selectRequest,
}: {
  currentTime: number;
  filteredAfterCount: number;
  filteredBeforeCount: number;
  requests: RequestSummary[];
  seekToRequest: (request: RequestSummary) => void;
  selectedRequestId: string | null;
  selectRequest: (request: RequestSummary | null) => void;
}) {
  const [enabledColumns] = useNetworkMonitorColumns();

  let itemCount = requests.length;
  if (filteredBeforeCount > 0) {
    itemCount++;
  }
  if (filteredAfterCount > 0) {
    itemCount++;
  }

  const firstRequestIdAfterCurrentTime = useMemo(() => {
    for (let index = 0; index < requests.length; index++) {
      const request = requests[index];
      if (request.point.time >= currentTime) {
        return request.id;
      }
    }
    return null;
  }, [currentTime, requests]);

  const [listRef, setListRef] = useState<List | null>(null);
  const listWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Don't auto-scroll the list if the user has selected a request; this would be jarring
    if (firstRequestIdAfterCurrentTime !== null && selectedRequestId === null) {
      if (listRef !== null) {
        const index = requests.findIndex(request => request.id === firstRequestIdAfterCurrentTime);
        if (index >= 0) {
          listRef.scrollToItem(index, "smart");
        }
      }
    }
  }, [firstRequestIdAfterCurrentTime, listRef, selectedRequestId]);

  useEffect(() => {
    if (selectedRequestId !== null) {
      const listWrapper = listWrapperRef.current;
      if (listRef !== null && listWrapper !== null) {
        const onKeyDown = (event: KeyboardEvent) => {
          switch (event.key) {
            case "ArrowDown":
            case "ArrowUp": {
              event.preventDefault();
              event.stopPropagation();

              const index = requests.findIndex(request => request.id === selectedRequestId);
              const newIndex = Math.max(
                0,
                Math.min(requests.length - 1, event.key === "ArrowUp" ? index - 1 : index + 1)
              );

              if (index !== newIndex) {
                const request = requests[newIndex];
                selectRequest(request);

                listRef.scrollToItem(newIndex, "smart");

                // Move focus to the newly selected item
                const listItem = listWrapper.querySelector(
                  `[data-test-id="Network-RequestRow-${request.id}"]`
                );
                if (listItem) {
                  (listItem as HTMLDivElement).focus();
                }
              }

              break;
            }
          }
        };

        listWrapper.addEventListener("keydown", onKeyDown, { capture: true });
        return () => {
          listWrapper.removeEventListener("keydown", onKeyDown, { capture: true });
        };
      }
    }
  }, [requests, selectRequest, selectedRequestId]);

  const itemData: ItemData = {
    columns: enabledColumns,
    currentTime,
    filteredAfterCount,
    filteredBeforeCount,
    firstRequestIdAfterCurrentTime,
    requests,
    seekToRequest,
    selectRequest,
    selectedRequestId,
  };

  return (
    <div className={styles.Container}>
      <NetworkMonitorListHeader columns={enabledColumns} />
      <div
        className={styles.ListWrapper}
        ref={listWrapperRef}
        data-test-id="Network-List"
        data-visible-items-count={itemCount}
      >
        <AutoSizer disableWidth>
          {({ height }: { height: number }) => (
            <List
              className={styles.List}
              height={height}
              itemCount={itemCount}
              itemData={itemData}
              itemSize={LIST_ROW_HEIGHT}
              ref={setListRef}
              width="100%"
            >
              {NetworkMonitorListRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
