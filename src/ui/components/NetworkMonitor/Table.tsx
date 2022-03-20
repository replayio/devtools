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
        width: 50,
        maxWidth: 100,
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
        width: 50,
        maxWidth: 100,
      },
      {
        Header: "Type",
        accessor: "documentType" as const,
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
    [requests, types]
  );

  const defaultColumn = useMemo(
    () => ({
      minWidth: 60,
      width: 200,
      maxWidth: 1000,
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

  return children({ table: tableInstance, data, ...props });
}
