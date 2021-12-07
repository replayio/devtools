import React, { useMemo, useState } from "react";
import { RequestSummary } from "./utils";
import styles from "./RequestDetails.module.css";
import classNames from "classnames";
import sortBy from "lodash/sortBy";
import PanelTabs from "devtools/client/shared/components/PanelTabs";
import ComingSoon from "./ComingSoon";
import CloseButton from "devtools/client/debugger/src/components/shared/Button/CloseButton";
import { trackEvent } from "ui/utils/telemetry";

interface Detail {
  name: string;
  value: string;
}

const DetailTable = ({ className, details }: { className?: string; details: Detail[] }) => {
  return (
    <div className={className}>
      <div className={classNames("px-4 flex flex-col")}>
        {details.map(h => (
          <div title={h.name} className={classNames(styles.row, styles.value)} key={h.name}>
            {h.name}
          </div>
        ))}
      </div>
      <div className="flex flex-col text-gray-400 ">
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

const HeadersPanel = ({ request }: { request: RequestSummary }) => {
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

  const toggleRequestExpanded = () => {
    trackEvent("network_monitor.toggle_request_expanded", { expanded: !requestExpanded });
    setRequestExpanded(!requestExpanded);
  };
  const toggleRequestHeadersExpanded = () => {
    trackEvent("network_monitor.toggle_request_headers_expanded", {
      expanded: !requestHeadersExpanded,
    });
    setRequestHeadersExpanded(!requestHeadersExpanded);
  };
  const toggleResponseHeadersExpanded = () => () => {
    trackEvent("network_monitor.toggle_response_headers_expanded", {
      expanded: !responseHeadersExpanded,
    });
    setResponseHeadersExpanded(!responseHeadersExpanded);
  };
  const toggleQueryParametersExpanded = () => {
    trackEvent("network_monitor.toggle_query_parameters_expanded", {
      expanded: !queryParametersExpanded,
    });
    setQueryParametersExpanded(!queryParametersExpanded);
  };

  return (
    <>
      <div
        className="flex items-center py-1 whitespace-nowrap cursor-pointer font-semibold"
        onClick={toggleRequestExpanded}
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
        className={classNames("py-1 border-t cursor-pointer font-semibold", styles.title)}
        onClick={toggleRequestHeadersExpanded}
      >
        <TriangleToggle open={requestHeadersExpanded} />
        Request Headers
      </h2>
      {requestHeadersExpanded && (
        <DetailTable className={styles.headerTable} details={requestHeaders} />
      )}
      <h2
        className={classNames("py-1 border-t cursor-pointer font-semibold", styles.title)}
        onClick={toggleResponseHeadersExpanded}
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
            className={classNames("py-1 border-t cursor-pointer font-semibold", styles.title)}
            onClick={toggleQueryParametersExpanded}
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
    { id: "headers", title: "Headers" },
    { id: "cookies", title: "Cookies" },
    { id: "response", title: "Response" },
    { id: "request", title: "Request" },
    { id: "initiator", title: "Stack Trace" },
    { id: "timings", title: "Timings" },
  ];

  if (!request) {
    return null;
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="overflow-hidden flex items-center justify-between">
        <PanelTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <CloseButton buttonClass="" handleClick={closePanel} tooltip={"Close tab"} />
      </div>
      <div className={classNames("", styles.requestDetails)}>
        {activeTab == "headers" && <HeadersPanel request={request} />}
        {activeTab == "cookies" && <ComingSoon />}
        {activeTab == "response" && <ComingSoon />}
        {activeTab == "request" && <ComingSoon />}
        {activeTab == "initiator" && <ComingSoon />}
        {activeTab == "timings" && <ComingSoon />}
      </div>
    </div>
  );
};

export default RequestDetails;
