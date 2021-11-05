import { useTable } from "react-table";
import React, { useMemo } from "react";
import groupBy from "lodash/groupBy";
import find from "lodash/find";
import { repeat } from "lodash";
import { TimeStampedPoint } from "@recordreplay/protocol";
import Status from "./Status";

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
  status: number;
  url: string;
};

const combinedInfoToRequestSummary = (
  infos: RequestInfo[],
  events: RequestEventInfo[]
): RequestSummary[] => {
  const intermediates = groupBy(events, "id");
  const combined = [];

  for (let info of infos) {
    const openEventInfo = events.find(e => e.event.kind === "request");
    const responseEventInfo = events.find(e => e.event.kind === "response");
    if (openEventInfo && responseEventInfo) {
      // I thought tsc would figure these types out, apparently not!
      const open: RequestOpenEvent = openEventInfo.event as RequestOpenEvent;
      const response: RequestResponseEvent = responseEventInfo.event as RequestResponseEvent;
      combined.push({
        url: open.requestUrl,
        status: response.responseStatus,
      });
    }
  }

  return combined;
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
      },
      {
        Header: "URL",
        accessor: "url" as const,
      },
    ],
    []
  );
  const data = useMemo(() => combinedInfoToRequestSummary(requests, events), [requests]);

  const tableInstance = useTable<RequestSummary>({ columns, data });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

  return (
    <div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
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
                    <td className="border p-1" {...cell.getCellProps()}>
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
