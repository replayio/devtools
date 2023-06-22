import classNames from "classnames";
import { Row, TableInstance } from "react-table";

import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { trackEvent } from "ui/utils/telemetry";

import { HeaderGroups } from "./HeaderGroups";
import { RequestRow } from "./RequestRow";
import { RequestSummary } from "./utils";
import styles from "./RequestTable.module.css";

const RequestTable = ({
  className,
  currentTime,
  data,
  filteredAfterCount,
  filteredBeforeCount,
  onRowSelect,
  seek,
  selectedRequest,
  table,
}: {
  className?: string;
  currentTime: number;
  data: RequestSummary[];
  filteredAfterCount: number;
  filteredBeforeCount: number;
  onRowSelect: (request: RequestSummary) => void;
  seek: (point: string, time: number, openSource: boolean, pauseId?: string | undefined) => boolean;
  selectedRequest?: RequestSummary;
  table: TableInstance<RequestSummary>;
}) => {
  const { columns, getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = table;

  const onSeek = (request: RequestSummary) => {
    trackEvent("net_monitor.seek_to_request");
    seek(request.point.point, request.point.time, true);
    onRowSelect(request);
  };

  let inPast = true;

  const [, dismissInspectNetworkRequestNag] = useNag(Nag.INSPECT_NETWORK_REQUEST);

  return (
    <div className={classNames("no-scrollbar min-w-full bg-bodyBgcolor", className)}>
      {/* Relative here helps with when the timeline goes past the last request*/}
      <div
        className={classNames("flex h-full w-full flex-col overflow-x-auto", styles.request)}
        {...getTableProps()}
      >
        <HeaderGroups columns={columns as any} headerGroups={headerGroups} />

        <div className="relative w-fit min-w-full overflow-y-auto" {...getTableBodyProps()}>
          {filteredBeforeCount > 0 && (
            <div className={styles.banner}>{filteredBeforeCount} requests filtered before</div>
          )}

          {rows.map((row: Row<RequestSummary>) => {
            let firstInFuture = false;
            if (inPast && row.original.point.time >= currentTime) {
              inPast = false;
              firstInFuture = true;
            }

            prepareRow(row);

            return (
              <RequestRow
                currentTime={currentTime}
                isFirstInFuture={firstInFuture}
                isInPast={inPast}
                isSelected={selectedRequest?.id === row.original.id}
                key={row.getRowProps().key}
                onClick={request => {
                  dismissInspectNetworkRequestNag();
                  onRowSelect(request);
                }}
                onSeek={onSeek}
                row={row}
              />
            );
          })}
          <div
            className={classNames({
              [styles.current]: data.every(r => (r.point?.time || 0) < currentTime),
              [styles.end]: data.every(r => (r.point?.time || 0) < currentTime),
            })}
          />

          {filteredAfterCount > 0 && (
            <div className={styles.banner}>{filteredAfterCount} requests filtered after</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestTable;
