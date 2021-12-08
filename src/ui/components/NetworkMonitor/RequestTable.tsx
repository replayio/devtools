import React from "react";
import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { RequestSummary } from "./utils";
import { HeaderGroups } from "./HeaderGroups";
import { RequestRow } from "./RequestRow";
import { Row, TableInstance } from "react-table";

const RequestTable = ({
  currentTime,
  data,
  onRowSelect,
  seek,
  table,
}: {
  currentTime: number;
  data: RequestSummary[];
  onRowSelect: (request: RequestSummary) => void;
  seek: (point: string, time: number, hasFrames: boolean, pauseId?: string | undefined) => boolean;
  selectedRequest?: RequestSummary;
  table: TableInstance<RequestSummary>;
}) => {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = table;

  const onSeek = (request: RequestSummary) => {
    seek(request.point.point, request.point.time, true);
    onRowSelect(request);
  };

  let inPast = true;

  return (
    <div className="bg-white w-full overflow-y-auto">
      <div className={classNames(styles.request)} {...getTableProps()}>
        <div
          className="sticky z-10 top-0"
          style={{ background: "var(--theme-tab-toolbar-background)" }}
        >
          <HeaderGroups headerGroups={headerGroups} />
        </div>
        <div {...getTableBodyProps()}>
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
                key={row.getRowProps().key}
                onClick={onRowSelect}
                onSeek={onSeek}
                row={row}
              />
            );
          })}
        </div>
        <div
          className={classNames(styles.row, {
            [styles.current]: data.every(r => (r.point?.time || 0) <= currentTime),
          })}
        />
      </div>
    </div>
  );
};

export default RequestTable;
