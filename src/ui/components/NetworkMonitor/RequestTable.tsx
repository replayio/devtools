import { useGlobalFilter, useBlockLayout, useResizeColumns, useTable } from "react-table";
import React, { useMemo } from "react";
import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { partialRequestsToCompleteSummaries, RequestSummary } from "./utils";
import { RequestEventInfo, RequestInfo } from "@recordreplay/protocol";
import MaterialIcon from "../shared/MaterialIcon";

const RequestTable = ({
  currentTime,
  events,
  onClick,
  requests,
  seek,
  selectedRequest,
}: {
  currentTime: number;
  events: RequestEventInfo[];
  onClick: (request: RequestSummary) => void;
  requests: RequestInfo[];
  seek: (point: string, time: number, hasFrames: boolean, pauseId?: string | undefined) => boolean;
  selectedRequest?: RequestSummary;
}) => {
  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name" as const,
      },
      {
        Header: "Status",
        // https://github.com/tannerlinsley/react-table/discussions/2664
        accessor: "status" as const,
        className: "m-auto",
        width: 50,
        maxWidth: 100,
      },
      {
        Header: "Method",
        accessor: "method" as const,
        className: "m-auto",
        width: 50,
        maxWidth: 100,
      },
      {
        Header: "Domain",
        accessor: "domain" as const,
      },
    ],
    []
  );
  const data = useMemo(() => partialRequestsToCompleteSummaries(requests, events), [requests]);
  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 50,
      width: 200,
      maxWidth: 1000,
    }),
    []
  );
  const tableInstance = useTable<RequestSummary>(
    { columns, data, defaultColumn },
    useBlockLayout,
    useGlobalFilter,
    useResizeColumns
  );
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

  let renderingRequestsInThePast = true;

  return (
    <div className="bg-white w-full overflow-y-scroll">
      <div className={classNames(styles.request)} {...getTableProps()}>
        <div className="sticky z-10 top-0 bg-white">
          <div className="border-b">
            {headerGroups.map(headerGroup => (
              <div className="flex font-normal items-center" {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <div
                    className={classNames("p-1", styles[column.id])}
                    {...column.getHeaderProps()}
                  >
                    {column.render("Header")}
                    <div
                      //@ts-ignore
                      {...column.getResizerProps()}
                      className={classNames("select-none", styles.resizer, {
                        //@ts-ignore typescript freaking *hates* react-table
                        isResizing: column.isResizing,
                      })}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="py-1 px-4 border-b flex items-center">
            <MaterialIcon iconSize="lg">search</MaterialIcon>
            <input
              placeholder="Filter requests"
              onChange={e => {
                //@ts-ignore
                tableInstance.setGlobalFilter(e.target.value);
              }}
              className="border rounded-sm px-1"
            />
          </div>
        </div>
        <div {...getTableBodyProps()}>
          {rows.map(row => {
            let currentRow = false;
            // Did we just pass the row boundary that contains the current time?
            // If so, let's render this row as the "current" row and all rows
            // after it as future rows.
            if (
              selectedRequest?.id === row.original.id ||
              (!selectedRequest &&
                renderingRequestsInThePast &&
                currentTime <= row.original.point.time)
            ) {
              renderingRequestsInThePast = false;
              currentRow = true;
            }

            prepareRow(row);
            return (
              <div
                className={classNames(styles.row, {
                  [styles.current]: currentRow,
                  "text-lightGrey": !renderingRequestsInThePast,
                })}
                onClick={() => {
                  seek(row.original.point.point, row.original.point.time, false);
                  onClick(row.original);
                }}
              >
                <div {...row.getRowProps()}>
                  {row.original.triggerPoint && row.original.triggerPoint.time !== currentTime && (
                    <div
                      className={classNames(styles.seekBadge)}
                      onClick={() => {
                        if (!row.original.triggerPoint) {
                          return;
                        }
                        seek(row.original.triggerPoint.point, row.original.triggerPoint.time, true);
                      }}
                    >
                      <div
                        className={classNames("img", {
                          [styles.fastForward]: row.original.triggerPoint.time > currentTime,
                          [styles.rewind]: row.original.triggerPoint.time < currentTime,
                        })}
                      />
                      <span className={classNames("px-2 text-white", styles.verbose)}>
                        {row.original.triggerPoint.time > currentTime ? "Fast-forward" : "Rewind"}
                      </span>
                    </div>
                  )}
                  {row.cells.map(cell => {
                    return (
                      <div
                        className={classNames(
                          "whitespace-nowrap p-1 items-center overflow-hidden",
                          styles[cell.column.id]
                        )}
                        {...cell.getCellProps()}
                        style={{ ...cell.getCellProps().style, display: "flex" }}
                      >
                        <div className={(cell.column as any).className}>{cell.render("Cell")}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
