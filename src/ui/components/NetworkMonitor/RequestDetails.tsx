import React, { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { findHeader, RequestSummary } from "./utils";
import styles from "./RequestDetails.module.css";
import classNames from "classnames";
import sortBy from "lodash/sortBy";
import PanelTabs from "devtools/client/shared/components/PanelTabs";
import CloseButton from "devtools/client/debugger/src/components/shared/Button/CloseButton";
import { Frames } from "../../../devtools/client/debugger/src/components/SecondaryPanes/Frames";
import { WiredFrame } from "protocol/thread/pause";
import ResponseBody from "./ResponseBody";
import { useFeature } from "ui/hooks/settings";
import RequestBody from "./RequestBody";
import { getLoadedRegions } from "ui/reducers/app";
import { useDispatch, useSelector } from "react-redux";
import { getPointIsInLoadedRegion } from "ui/utils/timeline";
import { hideRequestDetails } from "ui/actions/network";
import { getFormattedFrames } from "ui/reducers/network";
import { actions } from "ui/actions";

interface Detail {
  name: string;
  value: string | React.ReactChild;
}

export const RequestDetailsUnavailable: FC = () => {
  const dispatch = useDispatch();
  const closePanel = () => dispatch(hideRequestDetails());

  return (
    <div className="flex h-full w-full flex-col">
      <RequestDetailsTabs>
        <div className="flex flex-grow justify-end">
          <CloseButton buttonClass="mr-4" handleClick={closePanel} tooltip={"Close tab"} />
        </div>
      </RequestDetailsTabs>
      <div className="relative flex-grow">
        <div className="m-2">Request details currently unavailable</div>
      </div>
    </div>
  );
};

const RequestDetailsTabs: FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <div
      className={classNames(
        "sticky top-0 z-10 flex items-center justify-between bg-toolbarBackground",
        styles.border
      )}
    >
      {children}
    </div>
  );
};

function FormattedUrl({ url }: { url: string }) {
  const parsedUrl = new URL(url);
  const params = [...parsedUrl.searchParams.entries()];
  return (
    <span className="text-themeBody">
      <span className="">{parsedUrl.origin}</span>
      <span className="">{parsedUrl.pathname}</span>
      {params.length > 0 ? (
        <>
          {params.map(([key, value], index) => (
            <span key={key}>
              <span className="">{index === 0 ? "?" : "&"}</span>
              <span className="text-primaryAccent">{key}</span>
              <span>={value}</span>
            </span>
          ))}
        </>
      ) : null}
    </span>
  );
}

const DetailTable = ({ className, details }: { className?: string; details: Detail[] }) => {
  return (
    <div className={classNames(className, "flex flex-col")}>
      {details.map((h, i) => (
        <div
          className={classNames(styles.row, "cursor-pointer py-1 hover:bg-toolbarBackground")}
          key={`${h.name}-${i}`}
        >
          <span className="font-bold ">{h.name}:</span> {h.value}
        </div>
      ))}
    </div>
  );
};

export const TriangleToggle = ({ open }: { open: boolean }) => (
  <span
    className={classNames("img arrow select-none p-3", { expanded: open })}
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

const Cookies = ({ request }: { request: RequestSummary }) => {
  return (
    <div>
      <h2 className={classNames("cursor-pointer border-t p-4 py-1 font-bold", styles.title)}>
        Request Cookies
      </h2>
      <DetailTable
        className={styles.request}
        details={Object.entries(
          parseCookie(findHeader(request?.requestHeaders, "cookie") || "")
        ).map((value: [string, string]) => {
          return { name: value[0], value: value[1] };
        })}
      />
    </div>
  );
};

const StackTrace = ({ cx, frames }: { cx: any; frames: WiredFrame[] }) => {
  const dispatch = useDispatch();
  const selectFrame = (cx: any, frame: WiredFrame) => dispatch(actions.selectFrame(cx, frame));

  return (
    <div>
      <h1 className="py-2 px-4 font-bold">Stack Trace</h1>
      <div className="px-2">
        <Frames cx={cx} framesLoading={true} frames={frames} selectFrame={selectFrame} />
      </div>
    </div>
  );
};

const Timing = ({ request }: { request: RequestSummary }) => {
  const details = [{ name: "Started at", value: `${request.start}ms` }];
  if (request.firstByte) {
    details.push({ name: "Responded at (first byte)", value: `${request.firstByte}ms` });
    details.push({
      name: "Wait time to first byte",
      value: `${request.firstByte - request.start}ms`,
    });
  }
  if (request.end) {
    details.push({ name: "Ended at", value: `${request.end}ms` });
    details.push({ name: "Total time", value: `${request.end - request.start}ms` });
  }
  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 font-bold">Timings:</div>
      <DetailTable details={details} />
    </>
  );
};

const HeadersPanel = ({ request }: { request: RequestSummary }) => {
  const [requestExpanded, setRequestExpanded] = useState(true);
  const [requestHeadersExpanded, setRequestHeadersExpanded] = useState(true);
  const [responseHeadersExpanded, setResponseHeadersExpanded] = useState(true);
  const [queryParametersExpanded, setQueryParametersExpanded] = useState(true);

  const details = [
    { name: "URL", value: <FormattedUrl url={request.url} /> },
    { name: "Request Method", value: request.method },
    { name: "Status Code", value: String(request.status) },
    { name: "Type", value: request.documentType },
    { name: "Start", value: `${request.start}ms` },
  ];
  if (request.firstByte) {
    details.push({ name: "Time to first byte", value: `${request.firstByte - request.start}ms` });
  }
  if (request.end) {
    details.push({ name: "Total Time", value: `${request.end - request.start}ms` });
  }

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
        className={classNames("flex cursor-pointer items-center py-1 font-bold")}
        onClick={() => setRequestExpanded(!requestExpanded)}
      >
        <TriangleToggle open={requestExpanded} />
        General
      </div>
      {requestExpanded && <DetailTable className={styles.request} details={details} />}
      <div
        className={classNames(
          "cursor-pointer border-t border-themeBorder py-1 font-bold",
          styles.title
        )}
        onClick={() => setRequestHeadersExpanded(!requestHeadersExpanded)}
      >
        <TriangleToggle open={requestHeadersExpanded} />
        Request Headers
      </div>
      {requestHeadersExpanded && (
        <DetailTable className={styles.headerTable} details={requestHeaders} />
      )}
      {request.responseHeaders.length > 0 && (
        <>
          <div
            className={classNames("cursor-pointer border-t py-1 font-bold", styles.title)}
            onClick={() => setResponseHeadersExpanded(!responseHeadersExpanded)}
          >
            <TriangleToggle open={responseHeadersExpanded} />
            Response Headers
          </div>
          {responseHeadersExpanded && (
            <DetailTable className={styles.headerTable} details={responseHeaders} />
          )}
          {request.queryParams.length > 0 && (
            <div>
              <div
                className={classNames("cursor-pointer border-t py-1 font-bold", styles.title)}
                onClick={() => setQueryParametersExpanded(!queryParametersExpanded)}
              >
                <TriangleToggle open={queryParametersExpanded} />
                Query Parameters
              </div>
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
      )}
    </>
  );
};

const DEFAULT_TAB = "headers";

export type NetworkTab = "headers" | "cookies" | "response" | "request" | "stackTrace" | "timings";

const RequestDetails = ({ cx, request }: { cx: any; request: RequestSummary }) => {
  const dispatch = useDispatch();
  const frames = useSelector(getFormattedFrames)[request.point.point];
  const [activeTab, setActiveTab] = useState<NetworkTab>(DEFAULT_TAB);
  const loadedRegions = useSelector(getLoadedRegions)?.loaded;

  const { value: httpBodies } = useFeature("httpBodies");

  const tabs: readonly { id: NetworkTab; title: string; visible: boolean }[] = [
    { id: "headers", title: "Headers", visible: true },
    {
      id: "cookies",
      title: "Cookies",
      visible: Boolean(findHeader(request.requestHeaders, "cookie")),
    },
    { id: "request", title: "Request", visible: request.hasRequestBody && httpBodies },
    { id: "response", title: "Response", visible: request.hasResponseBody && httpBodies },
    { id: "stackTrace", title: "Stack Trace", visible: Boolean(request.triggerPoint) },
    {
      id: "timings",
      title: "Timings",
      visible: typeof request.start === "number" && typeof request.end === "number",
    },
  ];

  const activeTabs = tabs.filter(t => t.visible);
  const closePanel = () => dispatch(hideRequestDetails());

  useEffect(() => {
    if (!activeTabs.find(t => t.id === activeTab)) {
      setActiveTab(DEFAULT_TAB);
    }
  }, [activeTab, activeTabs]);

  if (!(loadedRegions && request && getPointIsInLoadedRegion(loadedRegions, request.point.point))) {
    return <RequestDetailsUnavailable />;
  }

  return (
    <div className="no-scrollbar w-full overflow-y-scroll border-l border-themeBorder bg-themeBodyBgcolor">
      <RequestDetailsTabs>
        <PanelTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <CloseButton buttonClass="mr-2" handleClick={closePanel} tooltip={"Close tab"} />
      </RequestDetailsTabs>
      <div className={classNames("requestDetails", styles.requestDetails)}>
        <div>
          {activeTab === "headers" && <HeadersPanel request={request} />}
          {activeTab === "cookies" && <Cookies request={request} />}
          {activeTab === "response" && <ResponseBody request={request} />}
          {activeTab === "request" && <RequestBody request={request} />}
          {activeTab === "stackTrace" && <StackTrace cx={cx} frames={frames} />}
          {activeTab === "timings" && <Timing request={request} />}
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
