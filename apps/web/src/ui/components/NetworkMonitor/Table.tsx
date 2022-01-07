import { RequestEventInfo, RequestInfo } from "@recordreplay/protocol";
import { useMemo } from "react";
import {
  useGlobalFilter,
  useBlockLayout,
  useResizeColumns,
  useTable,
  TableInstance,
} from "react-table";
import { partialRequestsToCompleteSummaries, RequestSummary, RequestType } from "./utils";

export default function Table({
  children,
  events,
  requests,
  types,
  ...props
}: {
  children: (props: {
    data: RequestSummary[];
    table: TableInstance<RequestSummary>;
  }) => JSX.Element;
  events: RequestEventInfo[];
  requests: RequestInfo[];
  types: Set<RequestType>;
}) {
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
        Header: "Type",
        accessor: "type" as const,
        className: "",
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
  const data = useMemo(
    () => partialRequestsToCompleteSummaries(requests, events, types),
    [requests, types]
  );

  const defaultColumn = useMemo(
    () => ({
      minWidth: 50,
      width: 200,
      maxWidth: 1000,
    }),
    []
  );
  const tableInstance = useTable<RequestSummary>(
    { columns: columns as any, data, defaultColumn },
    useBlockLayout,
    useGlobalFilter,
    useResizeColumns
  );

  return children({ table: tableInstance, data, ...props });
}
