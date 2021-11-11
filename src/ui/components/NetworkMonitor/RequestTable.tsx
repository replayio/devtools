import { useTable } from "react-table";
import React, { useMemo } from "react";
import keyBy from "lodash/keyBy";
import {
  Header,
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
import { UIState } from "ui/state";
import { getCurrentTime } from "ui/reducers/timeline";
import { actions } from "ui/actions";
import { sortBy } from "lodash";

type RequestSummary = {
  domain: string;
  end: number;
  method: string;
  name: string;
  point: TimeStampedPoint | undefined;
  requestHeaders: Header[];
  responseHeaders: Header[];
  start: number;
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
  const summaries = requests
    .map((r: RequestInfo) => ({ ...r, events: eventsToMap(eventsMap[r.id]) }))
    .filter(
      (r): r is RequestInfo & { events: RequestEventMap } =>
        !!r.events.request && !!r.events.response
    )
    .map((r: RequestInfo & { events: RequestEventMap }) => {
      const request = r.events.request;
      const response = r.events.response;
      return {
        domain: host(request.event.requestUrl),
        end: request.time,
        requestHeaders: request.event.requestHeaders,
        responseHeaders: response.event.responseHeaders,
        method: request.event.requestMethod,
        name: name(request.event.requestUrl),
        point: r.point,
        status: response.event.responseStatus,
        start: request.time,
        time: response.time - request.time,
        url: request.event.requestUrl,
      };
    });
  return sortBy(summaries, "start");
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
        className: "m-auto",
      },
      {
        Header: "Method",
        accessor: "method" as const,
        className: "m-auto",
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
        className: "m-auto",
      },
    ],
    []
  );
  const data = useMemo(() => partialRequestsToCompleteSummaries(requests, events), [requests]);
  const tableInstance = useTable<RequestSummary>({ columns, data });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
  const currentTimeIndex = data.findIndex(r => currentTime < (r.point?.time || 0));

  return (
    <div className="bg-white overflow-y-scroll">
      <div className={classNames("w-full", styles.request)} {...getTableProps()}>
        <div className="sticky top-0">
          {headerGroups.map(headerGroup => (
            <div className="flex" {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <div
                  className={classNames("bg-white font-normal p-1", styles[column.id])}
                  {...column.getHeaderProps()}
                >
                  {column.render("Header")}
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
                className={classNames("flex items-stretch", styles.row, {
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
                    <div
                      className={classNames(
                        "whitespace-nowrap p-1 flex items-center overflow-hidden",
                        styles[cell.column.id]
                      )}
                      {...cell.getCellProps()}
                    >
                      <div className={(cell.column as any).className}>{cell.render("Cell")}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
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
