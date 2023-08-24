import { CSSProperties } from "react";

import Icon from "replay-next/components/Icon";
import useNetworkContextMenu from "ui/components/NetworkMonitor/useNetworkContextMenu";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";

import styles from "./NetworkMonitorListRow.module.css";

export const LIST_ROW_HEIGHT = 27;

export type ItemData = {
  currentTime: number;
  filteredAfterCount: number;
  filteredBeforeCount: number;
  firstRequestIdAfterCurrentTime: string | null;
  requests: RequestSummary[];
  seekToRequest: (row: RequestSummary) => void;
  selectRequest: (row: RequestSummary) => void;
  selectedRequestId: string | null;
};

export function NetworkMonitorListRow({
  data: itemData,
  index: rowIndex,
  style,
}: {
  data: ItemData;
  index: number;
  style: CSSProperties;
}) {
  const { requests, filteredAfterCount, filteredBeforeCount } = itemData;

  const requestIndex = filteredBeforeCount > 0 ? rowIndex - 1 : rowIndex;

  if (filteredBeforeCount > 0 && rowIndex === 0) {
    return (
      <div className={styles.HeaderRow} style={style}>
        {filteredAfterCount} requests filtered before
      </div>
    );
  } else if (filteredAfterCount > 0 && requestIndex === requests.length) {
    return (
      <div className={styles.FooterRow} style={style}>
        {filteredAfterCount} requests filtered after
      </div>
    );
  } else {
    const request = requests[requestIndex];

    return <RequestRow itemData={itemData} request={request} style={style} />;
  }
}

function RequestRow({
  itemData,
  request,
  style,
}: {
  itemData: ItemData;
  request: RequestSummary;
  style: CSSProperties;
}) {
  const {
    currentTime,
    firstRequestIdAfterCurrentTime,
    seekToRequest,
    selectRequest,
    selectedRequestId,
  } = itemData;

  const { cause, documentType, domain, id, method, name, point, status, triggerPoint, url } =
    request;

  let type = documentType || cause;
  if (type === "unknown") {
    type = "";
  }

  const { contextMenu, onContextMenu } = useNetworkContextMenu({ requestSummary: request });

  const isAfterCurrentTime = point.time >= currentTime;

  let dataCurrentTime = undefined;
  if (id === firstRequestIdAfterCurrentTime) {
    dataCurrentTime = "first-after";
  } else if (isAfterCurrentTime) {
    dataCurrentTime = "after";
  }

  return (
    <>
      <div
        className={styles.Row}
        data-current-time={dataCurrentTime}
        data-selected={selectedRequestId === id || undefined}
        data-test-id={`NetworkMonitor-RequestRow-${id}`}
        data-test-name="NetworkMonitor-RequestRow"
        onClick={() => selectRequest(request)}
        onContextMenu={onContextMenu}
        style={style}
        tabIndex={0}
      >
        <div className={styles.StatusColumn}>{status}</div>
        <div className={styles.NameColumn}>{name}</div>
        <div className={styles.MethodColumn}>{method}</div>
        <div className={styles.TypeColumn}>{type}</div>
        <div className={styles.DomainColumn} title={url}>
          {domain}
        </div>

        {triggerPoint && triggerPoint.time !== currentTime && (
          <button className={styles.SeekButton} onClick={() => seekToRequest(request)} tabIndex={0}>
            <Icon
              className={styles.SeekButtonIcon}
              type={isAfterCurrentTime ? "fast-forward" : "rewind"}
            />
            <span className={styles.SeekButtonText}>
              {isAfterCurrentTime ? "Fast-forward" : "Rewind"}
            </span>
          </button>
        )}
      </div>
      {contextMenu}
    </>
  );
}
