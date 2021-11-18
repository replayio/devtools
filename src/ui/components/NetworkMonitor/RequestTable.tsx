import { useGlobalFilter, useBlockLayout, useResizeColumns, useTable } from "react-table";
import React, { useMemo } from "react";
import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { partialRequestsToCompleteSummaries, RequestSummary } from "./utils";
import { RequestEventInfo, RequestInfo } from "@recordreplay/protocol";
import MaterialIcon from "../shared/MaterialIcon";
import find from "lodash/find";

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
  const selectedRequestId = find(data, r => (r.point?.time || 0) >= currentTime)?.id;

  return (
    <div className="bg-white w-full overflow-y-scroll">
      <div className={classNames(styles.request)} {...getTableProps()}>
        <div className="sticky z-10 top-0 border-b">
          {headerGroups.map(headerGroup => (
            <div
              className="flex bg-white font-normal items-center"
              {...headerGroup.getHeaderGroupProps()}
            >
              {headerGroup.headers.map(column => (
                <div className={classNames("p-1", styles[column.id])} {...column.getHeaderProps()}>
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
        <div {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <div
                className={classNames(styles.row, {
                  "text-lightGrey": currentTime <= (row.original.point?.time || 0),
                  [styles.current]: selectedRequestId === row.original.id,
                })}
                onClick={() => onClick(row.original)}
              >
                <div {...row.getRowProps()}>
                  {row.original.triggerPoint && row.original.triggerPoint.time !== currentTime && (
                    <div
                      className={classNames(styles.seekBadge)}
                      onClick={() => {
                        if (!row.original.triggerPoint) {
                          return;
                        }
                        seek(
                          row.original.triggerPoint.point,
                          row.original.triggerPoint.time,
                          false
                        );
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
            [styles.current]: selectedRequestId === undefined,
          })}
        />
      </div>
    </div>
  );
};

export default RequestTable;
