import React from "react";
import { useSelector } from "react-redux";
import { getLoadedRegions } from "ui/reducers/app";
import { isTimeInRegions } from "ui/utils/timeline";

import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { RequestSummary } from "./utils";
import { HeaderGroups } from "./HeaderGroups";
import { RequestRow } from "./RequestRow";
import { Row, TableInstance } from "react-table";
import { trackEvent } from "ui/utils/telemetry";

const RequestTable = ({
  className,
  currentTime,
  data,
  onRowSelect,
  seek,
  selectedRequest,
  table,
}: {
  className?: string;
  currentTime: number;
  data: RequestSummary[];
  onRowSelect: (request: RequestSummary) => void;
  seek: (point: string, time: number, hasFrames: boolean, pauseId?: string | undefined) => boolean;
  selectedRequest?: RequestSummary;
  table: TableInstance<RequestSummary>;
}) => {
  const { columns, getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = table;

  const loadedRegions = useSelector(getLoadedRegions);

  const onSeek = (request: RequestSummary) => {
    trackEvent("net_monitor.seek_to_request");
    seek(request.point.point, request.point.time, true);
    onRowSelect(request);
  };

  let inPast = true;

  return (
    <div
      className={classNames("no-scrollbar min-w-full overflow-scroll bg-bodyBgcolor", className)}
    >
      {/* Relative here helps with when the timeline goes past the last request*/}
      <div
        style={{ minWidth: "fit-content" }}
        className={classNames(styles.request, "relative")}
        {...getTableProps()}
      >
        <div className="sticky top-0 z-10 border-b border-splitter bg-toolbarBackground">
          <HeaderGroups columns={columns} headerGroups={headerGroups} />
        </div>
        <div style={{ minWidth: "fit-content" }} {...getTableBodyProps()}>
          {rows.map((row: Row<RequestSummary>) => {
            let firstInFuture = false;
            if (inPast && row.original.point.time >= currentTime) {
              inPast = false;
              firstInFuture = true;
            }

            const isInLoadedRegion = loadedRegions
              ? isTimeInRegions(row.original.point.time, loadedRegions.loaded)
              : false;

            prepareRow(row);

            return (
              <RequestRow
                currentTime={currentTime}
                isFirstInFuture={firstInFuture}
                isInLoadedRegion={isInLoadedRegion}
                isInPast={inPast}
                isSelected={selectedRequest?.id === row.original.id}
                key={row.getRowProps().key}
                onClick={onRowSelect}
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
        </div>
      </div>
    </div>
  );
};

export default RequestTable;
