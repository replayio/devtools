import {
  Header,
  RequestBodyEvent,
  RequestDoneEvent,
  RequestEventInfo,
  RequestInfo,
  RequestOpenEvent,
  RequestResponseBodyEvent,
  RequestResponseEvent,
  TimeStampedPoint,
} from "@recordreplay/protocol";
import keyBy from "lodash/keyBy";
import { compareNumericStrings } from "protocol/utils";

export enum CanonicalRequestType {
  CSS,
  FETCH_XHR,
  FONT,
  HTML,
  IMAGE,
  JAVASCRIPT,
  MANIFEST,
  MEDIA,
  OTHER,
  WASM,
  WEBSOCKET,
}

export type RequestSummary = {
  domain: string;
  documentType: string;
  end: number | undefined;
  firstByte: number | undefined;
  hasResponseBody: boolean;
  hasRequestBody: boolean;
  id: string;
  method: string;
  name: string;
  point: TimeStampedPoint;
  queryParams: [string, string][];
  triggerPoint: TimeStampedPoint | undefined;
  requestHeaders: Header[];
  responseHeaders: Header[];
  start: number;
  status: number | undefined;
  type: CanonicalRequestType;
  url: string;
};

export const RequestTypeOptions: { type: CanonicalRequestType; icon: string; label: string }[] = [
  { type: CanonicalRequestType.CSS, icon: "color_lens", label: "CSS" },
  { type: CanonicalRequestType.FETCH_XHR, icon: "description", label: "Fetch/XHR" },
  { type: CanonicalRequestType.FONT, icon: "text_fields", label: "Font" },
  { type: CanonicalRequestType.HTML, icon: "description", label: "HTML" },
  { type: CanonicalRequestType.IMAGE, icon: "perm_media", label: "Image" },
  { type: CanonicalRequestType.JAVASCRIPT, icon: "code", label: "Javascript" },
  { type: CanonicalRequestType.MANIFEST, icon: "description", label: "Manifest" },
  { type: CanonicalRequestType.MEDIA, icon: "perm_media", label: "Media" },
  { type: CanonicalRequestType.OTHER, icon: "question_mark", label: "Other" },
  { type: CanonicalRequestType.WASM, icon: "handyman", label: "WASM" },
  { type: CanonicalRequestType.WEBSOCKET, icon: "autorenew", label: "Websocket" },
];

// From https://github.com/RecordReplay/gecko-dev/blob/webreplay-release/devtools/server/actors/replay/network-helpers.jsm#L14
export const REQUEST_TYPES: Record<string, CanonicalRequestType> = {
  subdocument: CanonicalRequestType.HTML,
  objectSubdoc: CanonicalRequestType.HTML,

  fetch: CanonicalRequestType.FETCH_XHR,
  xhr: CanonicalRequestType.FETCH_XHR,

  beacon: CanonicalRequestType.OTHER,
  csp: CanonicalRequestType.OTHER,
  dtd: CanonicalRequestType.OTHER,
  invalid: CanonicalRequestType.OTHER,
  object: CanonicalRequestType.OTHER,
  other: CanonicalRequestType.OTHER,
  ping: CanonicalRequestType.OTHER,
  xslt: CanonicalRequestType.OTHER,

  img: CanonicalRequestType.IMAGE,
  imageset: CanonicalRequestType.IMAGE,

  font: CanonicalRequestType.FONT,
  webManifest: CanonicalRequestType.MANIFEST,
  media: CanonicalRequestType.MEDIA,
  script: CanonicalRequestType.JAVASCRIPT,
  stylesheet: CanonicalRequestType.CSS,
  wasm: CanonicalRequestType.WASM,
  websocket: CanonicalRequestType.WEBSOCKET,
};

export const findHeader = (headers: Header[] | undefined, key: string): string | undefined =>
  headers?.find(h => h.name.toLowerCase() === key)?.value;

export type RequestEventMap = {
  request: { time: number; event: RequestOpenEvent };
  "request-done": { time: number; event: RequestDoneEvent };
  "response-body": { time: number; event: RequestResponseBodyEvent };
  "request-body": { time: number; event: RequestBodyEvent };
  response: { time: number; event: RequestResponseEvent } | null;
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
    .pop() || "/";

const queryParams = (url: string): [string, string][] => {
  //@ts-ignore
  return Array.from(new URL(url).searchParams.entries() as [string, string][]);
};
const getDocumentType = (headers: Header[]): string => {
  const contentType = findHeader(headers, "content-type") || "unknown";
  // chop off any charset or other extra data
  return contentType.match(/^(.*)[,;]/)?.[1] || contentType;
};

export const partialRequestsToCompleteSummaries = (
  requests: RequestInfo[],
  events: RequestEventInfo[],
  types: Set<CanonicalRequestType>
): RequestSummary[] => {
  const eventsMap = eventsByRequestId(events);
  const summaries = requests
    .map((r: RequestInfo) => ({ ...r, events: eventsToMap(eventsMap[r.id]) }))
    .filter((r): r is RequestInfo & { events: RequestEventMap } => !!r.events.request)
    .map((r: RequestInfo & { events: RequestEventMap }) => {
      const request = r.events.request;
      const response = r.events.response;
      const requestDone = r.events["request-done"];
      const documentType = response ? getDocumentType(response.event.responseHeaders) : "unknown";
      return {
        documentType,
        domain: host(request.event.requestUrl),
        firstByte: response?.time,
        end: requestDone?.time,
        hasResponseBody: Boolean(r.events["response-body"]),
        hasRequestBody: Boolean(r.events["request-body"]),
        id: r.id,
        method: request.event.requestMethod,
        name: name(request.event.requestUrl),
        point: {
          point: r.point,
          time: r.time,
        },
        queryParams: queryParams(request.event.requestUrl),
        requestHeaders: request.event.requestHeaders,
        responseHeaders: response?.event.responseHeaders || [],
        start: request.time,
        status: response?.event.responseStatus,
        triggerPoint: r.triggerPoint,
        type: REQUEST_TYPES[request.event.requestCause || ""] || CanonicalRequestType.OTHER,
        url: request.event.requestUrl,
      };
    })
    .filter(row => types.size === 0 || types.has(row.type));

  summaries.sort((a, b) => compareNumericStrings(a.point.point, b.point.point));

  return summaries;
};

export function base64ToArrayBuffer(base64: string) {
  var binaryString = window.atob(base64);
  var len = binaryString.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export const contentType = (headers: Header[]): "json" | "text" | "other" => {
  const contentType = getDocumentType(headers);
  if (contentType?.startsWith("application/json")) {
    return "json";
  }
  if (contentType?.startsWith("text/")) {
    return "text";
  }
  if (contentType?.startsWith("application/x-www-form-urlencoded")) {
    return "text";
  }
  return "other";
};
