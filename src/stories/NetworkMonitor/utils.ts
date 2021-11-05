import { RequestEventInfo, RequestInfo } from "ui/components/NetworkMonitor/RequestTable";
import { CombinedRequestInfo } from "ui/components/NetworkMonitor/RequestTable";

export const eventsFor = (id: string, url: string, status: number): RequestEventInfo[] => {
  return [
    {
      event: {
        kind: "request",
        requestUrl: url,
        requestMethod: "GET",
        requestHeaders: [],
        requestCause: "app.js:31",
      },
      id,
      time: 0,
    },
    {
      event: {
        kind: "response",
        responseFromCache: false,
        responseHeaders: [],
        responseProtocolVersion: "1",
        responseStatus: status,
        responseStatusText: "test",
      },
      id,
      time: 0,
    },
  ];
};

export const requestProps = (id: string, url: string, status: number): CombinedRequestInfo => {
  return {
    events: eventsFor(id, url, status),
    info: { id, point: { point: "1", time: 1 } },
  };
};
