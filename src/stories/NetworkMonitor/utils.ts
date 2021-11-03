import { RequestEvent, RequestInfo, RequestEventInfo } from "@recordreplay/protocol";

export const eventsFor = (
  id: string,
  url: string,
  status: number,
  method: string
): RequestEventInfo[] => {
  return [
    {
      id,
      time: 0,
      event: {
        kind: "request",
        requestCause: "app.js:31",
        requestHeaders: [],
        requestMethod: method,
        requestUrl: url,
      },
    },
    {
      id,
      time: Math.floor(1000 * Math.random()),
      event: {
        kind: "response",
        responseFromCache: false,
        responseHeaders: [],
        responseProtocolVersion: "1",
        responseStatus: status,
        responseStatusText: "test",
      },
    },
  ];
};

export const requestProps = (
  id: string,
  url: string,
  status: number,
  method: string = "GET"
): { events: RequestEventInfo[]; info: RequestInfo } => {
  return {
    events: eventsFor(id, url, status, method),
    info: { id, time: Number(id), point: { point: "1", time: Number(id) } },
  };
};
