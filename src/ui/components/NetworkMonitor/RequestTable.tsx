import { useTable } from "react-table";
import React, { useMemo } from "react";
import keyBy from "lodash/keyBy";
import { TimeStampedPoint } from "@recordreplay/protocol";
import Status from "./Status";
import styles from "./RequestTable.module.css";
import classNames from "classnames";

interface Header {
  name: string;
  value: string;
}

interface RequestOpenEvent extends RequestEventInfo {
  kind: "request";
  requestUrl: string;
  requestMethod: string;
  requestHeaders: Header[];
  requestCause: string;
}

export interface RequestEventInfo {
  id: string;
  time: number;
}

interface RequestResponseEvent extends RequestEventInfo {
  kind: "response";
  responseHeaders: Header[];
  responseProtocolVersion: string;
  responseStatus: number;
  responseStatusText: string;
  responseFromCache: boolean;
}

export type RequestEvent = RequestResponseEvent | RequestOpenEvent;

export interface RequestInfo {
  id: string;
  point: TimeStampedPoint;
}

export type CombinedRequestInfo = {
  events: RequestEvent[];
  info: RequestInfo;
};

type RequestSummary = {
  domain: string;
  method: string;
  name: string;
  point: TimeStampedPoint;
  status: number;
  time: number;
  url: string;
};

type RequestEventMap = {
  request: RequestOpenEvent;
  response: RequestResponseEvent;
};

const eventsToMap = (events: RequestEvent[]): Partial<RequestEventMap> => {
  return keyBy(events, e => e.kind);
};

const eventsByRequestId = (events: RequestEvent[]): Record<string, RequestEvent[]> => {
  return events.reduce((acc: Record<string, RequestEvent[]>, eventInfo) => {
    acc[eventInfo.id] = [eventInfo, ...(acc[eventInfo.id] || [])];
    return acc;
  }, {});
};

const host = (url: string): string => new URL(url).host;
const name = (url: string): string =>
  new URL(url).pathname
    .split("/")
    .filter(f => f.length)
    .pop() || "";
const partialRequestsToCompleteSummaries = (
  requests: RequestInfo[],
  events: RequestEvent[]
): RequestSummary[] => {
  const eventsMap = eventsByRequestId(events);
  return requests
    .map(r => ({ ...r, events: eventsToMap(eventsMap[r.id]) }))
    .filter(
      (r): r is RequestInfo & { events: RequestEventMap } =>
        !!r.events.request && !!r.events.response
    )
    .map(request => ({
      domain: host(request.events.request.requestUrl),
      method: request.events.request.requestMethod,
      name: name(request.events.request.requestUrl),
      point: request.point,
      status: request.events.response.responseStatus,
      time: request.events.response.time - request.events.request.time,
      url: request.events.request.requestUrl,
    }));
};

type RequestTableProps = {
  currentTime: number;
  events: RequestEvent[];
  requests: RequestInfo[];
};

const RequestTable = ({ currentTime, events, requests }: RequestTableProps) => {
  const columns = useMemo(
    () => [
      {
        Header: "Status",
        Cell: Status,
        // https://github.com/tannerlinsley/react-table/discussions/2664
        accessor: "status" as const,
        className: "text-center",
      },
      {
        Header: "Method",
        accessor: "method" as const,
      },
      {
        Header: "Domain",
        accessor: "domain" as const,
      },
      {
        Header: "Name",
        accessor: "name" as const,
      },
      {
        Header: "Time",
        accessor: "time" as const,
      },
      // {
      //   Header: "URL",
      //   accessor: "url" as const,
      // },
    ],
    []
  );
  const data = useMemo(() => partialRequestsToCompleteSummaries(requests, events), [requests]);
  const tableInstance = useTable<RequestSummary>({ columns, data });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
  const currentTimeIndex = data.findIndex(r => currentTime < r.point.time);

  return (
    <div>
      <table className="w-full" {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th className="font-normal border p-1" {...column.getHeaderProps()}>
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr
                className={classNames({
                  "text-lightGrey": currentTime < row.original.point.time,
                  [styles.next]: currentTimeIndex === i,
                })}
                {...row.getRowProps()}
              >
                {row.cells.map(cell => {
                  return (
                    <td
                      className={classNames("border p-1", (cell.column as any).className)}
                      {...cell.getCellProps()}
                    >
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RequestTable;
