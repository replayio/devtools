import { RequestEventInfo, RequestInfo } from "@recordreplay/protocol";
import { useMemo } from "react";
import {
  useGlobalFilter,
  useBlockLayout,
  useResizeColumns,
  useTable,
  TableInstance,
} from "react-table";

import { CanonicalRequestType, partialRequestsToCompleteSummaries, RequestSummary } from "./utils";

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
  types: Set<CanonicalRequestType>;
}) {
  const columns = useMemo(
    () => [
      {
        Header: "Status",
        // https://github.com/tannerlinsley/react-table/discussions/2664
        accessor: "status" as const,
        maxWidth: 100,
        width: 50,
      },
      {
        Header: "Name",
        accessor: "name" as const,
      },
      {
        Header: "Path",
        accessor: "path" as const,
      },
      {
        Header: "Url",
        accessor: "url" as const,
      },
      {
        Header: "Method",
        accessor: "method" as const,
        maxWidth: 100,
        width: 50,
      },
      {
        Header: "Type",
        accessor: (req: RequestSummary) => req.documentType || req.cause,
        className: "",
        width: 125,
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
    [events, requests, types]
  );

  const defaultColumn = useMemo(
    () => ({
      maxWidth: 1000,
      minWidth: 60,
      width: 200,
    }),
    []
  );
  const tableInstance = useTable<RequestSummary>(
    {
      //@ts-ignore
      autoResetGlobalFilter: false,
      columns: columns as any,
      data,
      defaultColumn,
      initialState: { hiddenColumns: ["url", "path"] },
    },
    useBlockLayout,
    useGlobalFilter,
    useResizeColumns
  );

  return children({ data, table: tableInstance, ...props });
}
