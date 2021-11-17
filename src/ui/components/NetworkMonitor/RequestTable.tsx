import { useBlockLayout, useResizeColumns, useTable } from "react-table";
import React, { useMemo } from "react";
import Status from "./Status";
import styles from "./RequestTable.module.css";
import classNames from "classnames";
import findLastIndex from "lodash/findLastIndex";
import { partialRequestsToCompleteSummaries, RequestSummary } from "./utils";
import { RequestEventInfo, RequestInfo } from "@recordreplay/protocol";

const RequestTable = ({
  currentTime,
  events,
  onClick,
  seek,
  requests,
}: {
  currentTime: number;
  events: RequestEventInfo[];
  requests: RequestInfo[];
  seek: (point: string, time: number, hasFrames: boolean, pauseId?: string | undefined) => boolean;
  onClick: (request: RequestSummary) => void;
}) => {
  const columns = useMemo(
    () => [
      {
        Header: "Status",
        Cell: Status,
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
      {
        Header: "Name",
        accessor: "name" as const,
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
    useResizeColumns
  );
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
  const currentTimeIndex = findLastIndex(data, r => currentTime > (r.point?.time || 0));

  return (
    <div className="bg-white w-full overflow-y-scroll">
      <div className={classNames("", styles.request)} {...getTableProps()}>
        <div className="sticky top-0 border-b">
          {headerGroups.map(headerGroup => (
            <div className="flex" {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <div
                  className={classNames("bg-white font-normal p-1", styles[column.id])}
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
        <div {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <div
                className={classNames(styles.row, {
                  "text-lightGrey": currentTime <= (row.original.point?.time || 0),
                  [styles.last]: currentTimeIndex === i,
                })}
                onClick={() => {
                  onClick(row.original);
                  if (!row.original.point) {
                    return;
                  }
                  seek(row.original.point.point, row.original.point.time, false);
                }}
              >
                <div {...row.getRowProps()}>
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
            [styles.last]: currentTimeIndex === -1,
          })}
        />
      </div>
    </div>
  );
};

export default RequestTable;
