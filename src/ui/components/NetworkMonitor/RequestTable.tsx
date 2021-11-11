import { useTable } from "react-table";
import React, { useMemo } from "react";
import keyBy from "lodash/keyBy";
import {
  RequestEvent,
  RequestEventInfo,
  RequestInfo,
  RequestOpenEvent,
  RequestResponseEvent,
  TimeStampedPoint,
} from "@recordreplay/protocol";
import Status from "./Status";
import styles from "./RequestTable.module.css";
import classNames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers/network";
import { selectionSetMatchesResult } from "@apollo/client/cache/inmemory/helpers";
import { UIState } from "ui/state";
import { getCurrentTime } from "ui/reducers/timeline";
import { actions } from "ui/actions";

type RequestSummary = {
  domain: string;
  method: string;
  name: string;
  point: TimeStampedPoint | undefined;
  status: number;
  time: number;
  url: string;
};

type RequestEventMap = {
  request: { time: number; event: RequestOpenEvent };
  response: { time: number; event: RequestResponseEvent };
};

const eventsToMap = (events: RequestEventInfo[]): Partial<RequestEventMap> => {
  return keyBy(events, e => e.event.kind);
};

const eventsByRequestId = (events: RequestEventInfo[]): Record<string, RequestEventInfo[]> => {
  return events.reduce((acc: Record<string, RequestEventInfo[]>, eventInfo) => {
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
  events: RequestEventInfo[]
): RequestSummary[] => {
  const eventsMap = eventsByRequestId(events);
  return requests
    .map((r: RequestInfo) => ({ ...r, events: eventsToMap(eventsMap[r.id]) }))
    .filter(
      (r): r is RequestInfo & { events: RequestEventMap } =>
        !!r.events.request && !!r.events.response
    )
    .map(request => ({
      domain: host(request.events.request.event.requestUrl),
      method: request.events.request.event.requestMethod,
      name: name(request.events.request.event.requestUrl),
      point: request.point,
      status: request.events.response.event.responseStatus,
      time: request.events.response.time - request.events.request.time,
      url: request.events.request.event.requestUrl,
    }));
};

type RequestTableProps = PropsFromRedux;

const RequestTable = ({ currentTime, events, seekToTime, requests }: RequestTableProps) => {
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
    ],
    []
  );
  const data = useMemo(() => partialRequestsToCompleteSummaries(requests, events), [requests]);
  const tableInstance = useTable<RequestSummary>({ columns, data });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
  const currentTimeIndex = data.findIndex(r => currentTime < (r.point?.time || 0));

  return (
    <div className="overflow-y-scroll">
      <table className={classNames("w-full", styles.request)} {...getTableProps()}>
        <thead className="sticky top-0">
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th className="bg-chrome font-normal border p-1" {...column.getHeaderProps()}>
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
                  "text-lightGrey": currentTime < (row.original.point?.time || 0),
                  [styles.next]: currentTimeIndex === i,
                })}
                onClick={() => {
                  if (!row.original.point) {
                    return;
                  }
                  seekToTime(row.original.point?.time);
                }}
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

const connector = connect(
  (state: UIState) => ({
    events: selectors.getEvents(state),
    requests: selectors.getRequests(state),
    currentTime: getCurrentTime(state),
  }),
  { seekToTime: actions.seekToTime }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export const ConnectedRequestTable = connector(RequestTable);
