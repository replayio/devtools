import { CSSProperties, useContext } from "react";

import Icon from "replay-next/components/Icon";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import useNetworkContextMenu from "ui/components/NetworkMonitor/useNetworkContextMenu";
import { EnabledColumns } from "ui/components/NetworkMonitor/useNetworkMonitorColumns";
import { RequestSummary } from "ui/components/NetworkMonitor/utils";

import styles from "./NetworkMonitorListRow.module.css";

export const LIST_ROW_HEIGHT = 26;

export type ItemData = {
  columns: EnabledColumns;
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
    columns,
    currentTime,
    firstRequestIdAfterCurrentTime,
    seekToRequest,
    selectRequest,
    selectedRequestId,
  } = itemData;

  const { duration: recordingDuration } = useContext(SessionContext);

  const {
    cause,
    documentType,
    domain,
    end: endTime,
    id,
    method,
    name,
    path,
    point,
    start: startTime,
    status,
    triggerPoint,
    url,
  } = request;

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

  let statusCategory: string | undefined;
  if (status != null) {
    if (status >= 400) {
      statusCategory = "error";
    } else if (status >= 300) {
      statusCategory = "redirect";
    }
  }

  const [, dismissJumpToNetworkRequestNag] = useNag(Nag.JUMP_TO_NETWORK_REQUEST);

  const seekToRequestWrapper = (request: RequestSummary) => {
    seekToRequest(request);
    dismissJumpToNetworkRequestNag(); // Replay Passport
  };

  return (
    <>
      <div
        className={styles.Row}
        data-current-time={dataCurrentTime}
        data-selected={selectedRequestId === id || undefined}
        data-status-category={statusCategory}
        data-test-id={`Network-RequestRow-${id}`}
        data-test-name="Network-RequestRow"
        onClick={() => selectRequest(request)}
        onContextMenu={onContextMenu}
        style={style}
        tabIndex={0}
      >
        <div className={styles.Column} data-name="time">
          <div className={styles.TimingContainer} data-incomplete={endTime == null || undefined}>
            {endTime != null && (
              <div
                className={styles.Timing}
                style={{
                  left: `${(startTime / recordingDuration) * 100}%`,
                  width: `${((endTime - startTime) / recordingDuration) * 100}%`,
                }}
              />
            )}
          </div>
        </div>

        {columns.status && (
          <div className={styles.Column} data-name="status">
            {status}
          </div>
        )}
        {columns.name && (
          <div className={styles.Column} data-name="name">
            {name}
          </div>
        )}
        {columns.method && (
          <div className={styles.Column} data-name="method">
            {method}
          </div>
        )}
        {columns.type && (
          <div className={styles.Column} data-name="type">
            {type}
          </div>
        )}
        {columns.domain && (
          <div className={styles.Column} data-name="domain" title={domain}>
            {domain}
          </div>
        )}
        {columns.path && (
          <div className={styles.Column} data-name="path" title={path}>
            {path}
          </div>
        )}
        {columns.url && (
          <div className={styles.Column} data-name="url" title={url}>
            {url}
          </div>
        )}

        {triggerPoint && triggerPoint.time !== currentTime && (
          <button
            className={styles.SeekButton}
            data-test-name="Network-RequestRow-SeekButton"
            onClick={() => seekToRequestWrapper(request)}
            tabIndex={0}
          >
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
