import { useTable } from "react-table";
import React, { useMemo } from "react";
import keyBy from "lodash/keyBy";
import { TimeStampedPoint } from "@recordreplay/protocol";
import Status from "./Status";
import classNames from "classnames";

interface Header {
  name: string;
  value: string;
}

interface RequestOpenEvent {
  kind: "request";
  requestUrl: string;
  requestMethod: string;
  requestHeaders: Header[];
  requestCause: string;
}

interface RequestResponseEvent {
  kind: "response";
  responseHeaders: Header[];
  responseProtocolVersion: string;
  responseStatus: number;
  responseStatusText: string;
  responseFromCache: boolean;
}

export type RequestEvent = RequestResponseEvent | RequestOpenEvent;

export interface RequestEventInfo {
  id: string;
  time: number;
  event: RequestEvent;
}

export interface RequestInfo {
  id: string;
  point: TimeStampedPoint;
}

export type CombinedRequestInfo = {
  events: RequestEventInfo[];
  info: RequestInfo;
};

type RequestSummary = {
  point: TimeStampedPoint;
  status: number;
  url: string;
};

type RequestEventMap = {
  request: RequestOpenEvent;
  response: RequestResponseEvent;
};

const eventsToMap = (events: RequestEvent[]): Partial<RequestEventMap> => {
  return keyBy(events, e => e.kind);
};

const eventsByRequestId = (events: RequestEventInfo[]): Record<string, RequestEvent[]> => {
  return events.reduce((acc: Record<string, RequestEvent[]>, eventInfo) => {
    acc[eventInfo.id] = [eventInfo.event, ...(acc[eventInfo.id] || [])];
    return acc;
  }, {});
};

const partialRequestsToCompleteSummaries = (
  requests: RequestInfo[],
  events: RequestEventInfo[]
): RequestSummary[] => {
  const eventsMap = eventsByRequestId(events);
  return requests
    .map(r => ({ ...r, events: eventsToMap(eventsMap[r.id]) }))
    .filter(
      (r): r is RequestInfo & { events: RequestEventMap } =>
        !!r.events.request && !!r.events.response
    )
    .map(request => ({
      point: request.point,
      status: request.events.response.responseStatus,
      url: request.events.request.requestUrl,
    }));
};

type RequestTableProps = {
  events: RequestEventInfo[];
  requests: RequestInfo[];
};

const RequestTable = ({ events, requests }: RequestTableProps) => {
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
        Header: "URL",
        accessor: "url" as const,
      },
    ],
    []
  );
  const data = useMemo(() => partialRequestsToCompleteSummaries(requests, events), [requests]);
  const tableInstance = useTable<RequestSummary>({ columns, data });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

  return (
    <div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th className="border p-1" {...column.getHeaderProps()}>
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
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
