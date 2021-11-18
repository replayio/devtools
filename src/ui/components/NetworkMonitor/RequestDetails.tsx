import React, { useMemo, useState } from "react";
import { RequestSummary } from "./utils";
import styles from "./RequestDetails.module.css";
import classNames from "classnames";
import sortBy from "lodash/sortBy";

interface Detail {
  name: string;
  value: string;
}

const DetailTable = ({ className, details }: { className?: string; details: Detail[] }) => {
  return (
    <div className={className}>
      <div className={classNames("text-gray-400 px-4 flex flex-col")}>
        {details.map(h => (
          <div title={h.name} className={classNames(styles.row, styles.value)} key={h.name}>
            {h.name}
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        {details.map(h => (
          <div title={h.value} className={classNames(styles.row, styles.value)} key={h.name}>
            {h.value}
          </div>
        ))}
      </div>
    </div>
  );
};

const TriangleToggle = ({ open }: { open: boolean }) => (
  <span
    className={classNames("p-3 select-none img arrow", { expanded: open })}
    style={{ marginInlineEnd: "4px" }}
  />
);

const RequestDetails = ({ request }: { request: RequestSummary }) => {
  const [requestExpanded, setRequestExpanded] = useState(true);
  const [requestHeadersExpanded, setRequestHeadersExpanded] = useState(true);
  const [responseHeadersExpanded, setResponseHeadersExpanded] = useState(true);
  const [queryParametersExpanded, setQueryParametersExpanded] = useState(true);

  const requestHeaders = useMemo(
    () => sortBy(request?.requestHeaders, r => r.name.toLowerCase()),
    [request]
  );
  const responseHeaders = useMemo(
    () => sortBy(request?.responseHeaders, r => r.name.toLowerCase()),
    [request]
  );

  if (!request) {
    return null;
  }

  return (
    <div className={classNames("border-l w-full", styles.requestDetails)}>
      <div
        className={classNames("flex items-center py-1 whitespace-nowrap cursor-pointer")}
        onClick={() => setRequestExpanded(!requestExpanded)}
      >
        <TriangleToggle open={requestExpanded} />
        General
      </div>
      {requestExpanded && (
        <DetailTable
          className={styles.request}
          details={[
            { name: "URL", value: request.url },
            { name: "Request Method", value: request.method },
            { name: "Status Code", value: String(request.status) },
            { name: "Type", value: request.documentType },
            { name: "Start", value: `${request.start}ms` },
            { name: "First byte time", value: `${request.end}ms` },
          ]}
        />
      )}
      <h2
        className={classNames("py-1 border-t cursor-pointer", styles.title)}
        onClick={() => setRequestHeadersExpanded(!requestHeadersExpanded)}
      >
        <TriangleToggle open={requestHeadersExpanded} />
        Request Headers
      </h2>
      {requestHeadersExpanded && (
        <DetailTable className={styles.headerTable} details={requestHeaders} />
      )}
      <h2
        className={classNames("py-1 border-t cursor-pointer", styles.title)}
        onClick={() => setResponseHeadersExpanded(!responseHeadersExpanded)}
      >
        <TriangleToggle open={responseHeadersExpanded} />
        Response Headers
      </h2>
      {responseHeadersExpanded && (
        <DetailTable className={styles.headerTable} details={responseHeaders} />
      )}
      {request.queryParams.length > 0 && (
        <div>
          <h2
            className={classNames("py-1 border-t cursor-pointer", styles.title)}
            onClick={() => setQueryParametersExpanded(!queryParametersExpanded)}
          >
            <TriangleToggle open={queryParametersExpanded} />
            Query Parameters
          </h2>
          {queryParametersExpanded && (
            <DetailTable
              className={classNames("py-1", styles.request)}
              details={request.queryParams.map(x => ({
                name: x[0],
                value: x[1],
              }))}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RequestDetails;
