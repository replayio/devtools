import { RequestEventInfo } from "ui/components/NetworkMonitor/RequestRow";

export const eventsFor = (url: string, status: number): RequestEventInfo[] => {
  return [
    {
      event: {
        kind: "request",
        requestUrl: url,
        requestMethod: "GET",
        requestHeaders: [],
        requestCause: "app.js:31",
      },
      id: "1",
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
      id: "2",
      time: 0,
    },
  ];
};
