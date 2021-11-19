import {
  Header,
  RequestEventInfo,
  RequestInfo,
  RequestOpenEvent,
  RequestResponseEvent,
  TimeStampedPoint,
} from "@recordreplay/protocol";
import keyBy from "lodash/keyBy";
import { compareNumericStrings } from "protocol/utils";

export type RequestSummary = {
  domain: string;
  documentType: string;
  end: number;
  id: string;
  method: string;
  name: string;
  point: TimeStampedPoint;
  queryParams: [string, string][];
  triggerPoint: TimeStampedPoint | undefined;
  requestHeaders: Header[];
  responseHeaders: Header[];
  start: number;
  status: number;
  time: number;
  url: string;
};

export type RequestEventMap = {
  request: { time: number; event: RequestOpenEvent };
  response: { time: number; event: RequestResponseEvent };
};

export const eventsToMap = (events: RequestEventInfo[]): Partial<RequestEventMap> => {
  return keyBy(events, e => e.event.kind);
};

export const eventsByRequestId = (
  events: RequestEventInfo[]
): Record<string, RequestEventInfo[]> => {
  return events.reduce((acc: Record<string, RequestEventInfo[]>, eventInfo) => {
    acc[eventInfo.id] = [eventInfo, ...(acc[eventInfo.id] || [])];
    return acc;
  }, {});
};

const host = (url: string): string => new URL(url).host;
const name = (url: string): string =>
  new URL(url).pathname
    .split("/")
    .filter(f => f.length)
    .pop() || "";
const queryParams = (url: string): [string, string][] => {
  //@ts-ignore
  return Array.from(new URL(url).searchParams.entries() as [string, string][]);
};
const documentType = (headers: Header[]): string => {
  const contentType =
    headers.find(h => h.name.toLowerCase() === "content-type")?.value || "unknown";
  // chop off any charset or other extra data
  return contentType.match(/^(.*)[,;]/)?.[1] || contentType;
};

export const partialRequestsToCompleteSummaries = (
  requests: RequestInfo[],
  events: RequestEventInfo[]
): RequestSummary[] => {
  const eventsMap = eventsByRequestId(events);
  const summaries = requests
    .map((r: RequestInfo) => ({ ...r, events: eventsToMap(eventsMap[r.id]) }))
    .filter(
      (r): r is RequestInfo & { events: RequestEventMap } =>
        !!r.events.request && !!r.events.response
    )
    .map((r: RequestInfo & { events: RequestEventMap }) => {
      const request = r.events.request;
      const response = r.events.response;
      return {
        domain: host(request.event.requestUrl),
        documentType: documentType(response.event.responseHeaders),
        end: response.time,
        id: r.id,
        requestHeaders: request.event.requestHeaders,
        responseHeaders: response.event.responseHeaders,
        method: request.event.requestMethod,
        name: name(request.event.requestUrl),
        point: {
          point: r.point,
          time: r.time,
        },
        queryParams: queryParams(request.event.requestUrl),
        status: response.event.responseStatus,
        start: request.time,
        time: response.time - request.time,
        triggerPoint: r.triggerPoint,
        url: request.event.requestUrl,
      };
    });
  summaries.sort((a, b) => compareNumericStrings(a.point.point, b.point.point));
  return summaries;
};
