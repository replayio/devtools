import { RequestId } from "@replayio/protocol";
import { useMemo } from "react";
import {
  TableInstance,
  useBlockLayout,
  useGlobalFilter,
  useResizeColumns,
  useTable,
} from "react-table";

import { NetworkRequestsCacheData } from "replay-next/src/suspense/NetworkRequestsCache";

import { CanonicalRequestType, RequestSummary, partialRequestsToCompleteSummaries } from "./utils";

export default function Table({
  children,
  ids,
  records,
  types,
  ...props
}: {
  children: (props: {
    data: RequestSummary[];
    table: TableInstance<RequestSummary>;
  }) => JSX.Element;
  ids: RequestId[];
  records: NetworkRequestsCacheData["records"];
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
    () => partialRequestsToCompleteSummaries(ids, records, types),
    [ids, records, types]
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
