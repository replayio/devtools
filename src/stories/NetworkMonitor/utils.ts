import {
  RequestEvent,
  RequestEventInfo,
  RequestInfo,
} from "ui/components/NetworkMonitor/RequestTable";
import { CombinedRequestInfo } from "ui/components/NetworkMonitor/RequestTable";

export const eventsFor = (
  id: string,
  url: string,
  status: number,
  method: string
): RequestEvent[] => {
  return [
    {
      id,
      kind: "request",
      requestCause: "app.js:31",
      requestHeaders: [],
      requestMethod: method,
      requestUrl: url,
      time: 0,
    },
    {
      id,
      kind: "response",
      responseFromCache: false,
      responseHeaders: [],
      responseProtocolVersion: "1",
      responseStatus: status,
      responseStatusText: "test",
      time: Math.floor(1000 * Math.random()),
    },
  ];
};

export const requestProps = (
  id: string,
  url: string,
  status: number,
  method: string = "GET"
): CombinedRequestInfo => {
  return {
    events: eventsFor(id, url, status, method),
    info: { id, point: { point: "1", time: Number(id) } },
  };
};
