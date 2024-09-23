import {
  ExecutionPoint,
  Header,
  RequestBodyEvent,
  RequestDoneEvent,
  RequestEventInfo,
  RequestId,
  RequestOpenEvent,
  RequestResponseBodyEvent,
  RequestResponseEvent,
  TimeStampedPoint,
} from "@replayio/protocol";
import keyBy from "lodash/keyBy";

import { assert, compareExecutionPoints } from "protocol/utils";
import { NetworkRequestsCacheData } from "replay-next/src/suspense/NetworkRequestsCache";
import { TargetPoint } from "shared/client/types";

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
  cause: string | undefined;
  domain: string;
  documentType: string | undefined;
  end: number | undefined;
  firstByte: number | undefined;
  hasResponseBody: boolean;
  hasRequestBody: boolean;
  id: string;
  method: string;
  name: string;
  path: string;
  point: TimeStampedPoint;
  queryParams: [string, string][];
  triggerPoint: TimeStampedPoint | null;
  requestHeaders: Header[];
  responseHeaders: Header[];
  start: number;
  targetPoint: TargetPoint | null;
  status: number | undefined;
  type: CanonicalRequestType;
  url: string;
};

export const RequestTypeOptions: { type: CanonicalRequestType; icon: string; label: string }[] = [
  { type: CanonicalRequestType.CSS, icon: "palette", label: "CSS" },
  { type: CanonicalRequestType.FETCH_XHR, icon: "doc", label: "Fetch/XHR" },
  { type: CanonicalRequestType.FONT, icon: "typography", label: "Font" },
  { type: CanonicalRequestType.HTML, icon: "doc", label: "HTML" },
  { type: CanonicalRequestType.IMAGE, icon: "image", label: "Image" },
  { type: CanonicalRequestType.JAVASCRIPT, icon: "code", label: "Javascript" },
  { type: CanonicalRequestType.MANIFEST, icon: "list", label: "Manifest" },
  { type: CanonicalRequestType.MEDIA, icon: "image", label: "Media" },
  { type: CanonicalRequestType.OTHER, icon: "questionmark", label: "Other" },
  { type: CanonicalRequestType.WASM, icon: "tool", label: "WASM" },
  { type: CanonicalRequestType.WEBSOCKET, icon: "reload", label: "Websocket" },
];

// From https://github.com/RecordReplay/gecko-dev/blob/webreplay-release/devtools/server/actors/replay/network-helpers.jsm#L14
export const REQUEST_TYPES: Record<string, CanonicalRequestType> = {
  document: CanonicalRequestType.HTML,
  objectSubdoc: CanonicalRequestType.HTML,
  subdocument: CanonicalRequestType.HTML,

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

const host = (url: string): string => new URL(url).host;
const name = (url: string): string =>
  new URL(url).pathname
    .split("/")
    .filter(f => f.length)
    .pop() || "/";

export function getPathFromUrl(url: string) {
  let path = new URL(url).pathname;
  if (path.startsWith("/")) {
    path = path.substring(1);
  }

  return path;
}

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
  ids: RequestId[],
  records: NetworkRequestsCacheData["records"],
  types: Set<CanonicalRequestType>
): RequestSummary[] => {
  const summaries = ids
    .map(id => records[id])
    .filter(record => record.events.openEvent)
    .map(record => {
      const { bodyEvent, doneEvent, openEvent, responseBodyEvent, responseEvent } = record.events;

      assert(openEvent);

      return {
        cause: openEvent.requestCause,
        documentType: responseEvent ? getDocumentType(responseEvent.responseHeaders) : undefined,
        domain: host(openEvent.requestUrl),
        firstByte: responseEvent?.time,
        end: doneEvent?.time,
        hasResponseBody: responseBodyEvent !== null,
        hasRequestBody: bodyEvent !== null,
        id: record.id,
        method: openEvent.requestMethod,
        name: name(openEvent.requestUrl),
        path: getPathFromUrl(openEvent.requestUrl),
        point: record.timeStampedPoint,
        queryParams: queryParams(openEvent.requestUrl),
        requestHeaders: openEvent.requestHeaders,
        responseHeaders: responseEvent?.responseHeaders || [],
        start: record.timeStampedPoint.time,
        status: responseEvent?.responseStatus,
        triggerPoint: record.triggerPoint,
        targetPoint: record.targetPoint,
        type: REQUEST_TYPES[openEvent.requestCause || ""] ?? CanonicalRequestType.OTHER,
        url: openEvent.requestUrl,
      };
    })
    .filter(row => types.size === 0 || types.has(row.type));

  summaries.sort((a, b) => compareExecutionPoints(a.point.point, b.point.point));

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
