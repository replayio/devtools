import React, { useMemo, useState } from "react";
import { RequestSummary } from "./utils";
import styles from "./RequestDetails.module.css";
import classNames from "classnames";
import sortBy from "lodash/sortBy";
import PanelTabs from "devtools/client/shared/components/PanelTabs";
import ComingSoon from "./ComingSoon";
import CloseButton from "devtools/client/debugger/src/components/shared/Button/CloseButton";

interface Detail {
  name: string;
  value: string;
}

const DetailTable = ({ className, details }: { className?: string; details: Detail[] }) => {
  return (
    <div className={classNames(className, "flex flex-col")}>
      {details.map(h => (
        <div className={classNames(styles.row)} key={h.name}>
          <span className="font-bold text-gray-500">{h.name}:</span> {h.value}
        </div>
      ))}
    </div>
  );
};

const TriangleToggle = ({ open }: { open: boolean }) => (
  <span
    className={classNames("p-3 select-none img arrow", { expanded: open })}
    style={{ marginInlineEnd: "4px" }}
  />
);

const parseCookie = (str: string): Record<string, string> => {
  return str
    .split(";")
    .map(v => v.split("="))
    .reduce((acc: Record<string, string>, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});
};

const cookieHeader = (request: RequestSummary): string | undefined => {
  return request.requestHeaders.find(r => r.name.toLowerCase() === "cookie")?.value;
};

const Cookies = ({ request }: { request: RequestSummary }) => {
  return (
    <div>
      <h2 className={classNames("p-4 py-1 border-t cursor-pointer font-bold", styles.title)}>
        Request Cookies
      </h2>
      <DetailTable
        className={styles.request}
        details={Object.entries(parseCookie(cookieHeader(request) || "")).map(
          (value: [string, string]) => {
            return { name: value[0], value: value[1] };
          }
        )}
      />
    </div>
  );
};

const HeadersPanel = ({ request }: { request: RequestSummary }) => {
  const [requestExpanded, setRequestExpanded] = useState(true);
  const [requestHeadersExpanded, setRequestHeadersExpanded] = useState(true);
  const [responseHeadersExpanded, setResponseHeadersExpanded] = useState(true);
  const [queryParametersExpanded, setQueryParametersExpanded] = useState(true);

  const requestHeaders = useMemo(
    () => sortBy(request.requestHeaders, r => r.name.toLowerCase()),
    [request]
  );
  const responseHeaders = useMemo(
    () => sortBy(request.responseHeaders, r => r.name.toLowerCase()),
    [request]
  );
  return (
    <>
      <div
        className={classNames("flex items-center py-1 cursor-pointer font-bold")}
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
        className={classNames("py-1 border-t cursor-pointer font-bold", styles.title)}
        onClick={() => setRequestHeadersExpanded(!requestHeadersExpanded)}
      >
        <TriangleToggle open={requestHeadersExpanded} />
        Request Headers
      </h2>
      {requestHeadersExpanded && (
        <DetailTable className={styles.headerTable} details={requestHeaders} />
      )}
      <h2
        className={classNames("py-1 border-t cursor-pointer font-bold", styles.title)}
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
            className={classNames("py-1 border-t cursor-pointer font-bold", styles.title)}
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
    </>
  );
};

const RequestDetails = ({
  closePanel,
  request,
}: {
  closePanel: () => void;
  request: RequestSummary;
}) => {
  const [activeTab, setActiveTab] = useState("headers");

  const tabs = [
    { id: "headers", title: "Headers", visible: true },
    { id: "cookies", title: "Cookies", visible: Boolean(cookieHeader(request)) },
    { id: "response", title: "Response", visible: true },
    { id: "request", title: "Request", visible: true },
    { id: "initiator", title: "Stack Trace", visible: true },
    { id: "timings", title: "Timings", visible: true },
  ];

  if (!request) {
    return null;
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <div className={classNames("", styles.requestDetails)}>
        <div className="flex justify-between bg-toolbarBackground items-center">
          <PanelTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          <CloseButton buttonClass="" handleClick={closePanel} tooltip={"Close tab"} />
        </div>
        {activeTab == "headers" && <HeadersPanel request={request} />}
        {activeTab == "cookies" && <Cookies request={request} />}
        {activeTab == "response" && <ComingSoon />}
        {activeTab == "request" && <ComingSoon />}
        {activeTab == "initiator" && <ComingSoon />}
        {activeTab == "timings" && <ComingSoon />}
      </div>
    </div>
  );
};

export default RequestDetails;
