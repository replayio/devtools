import { TimeStampedPoint } from "./Recording";
/**
 * The string id of a request.
 */
export declare type RequestId = string;
/**
 * The range offsets within a request/response body.
 */
export interface BodyRange {
    /**
     * The inclusive start location of the data.
     * Defaults to zero.
     */
    start?: number;
    /**
     * The exclusive end location of the data.
     * Defaults to the length of the data.
     */
    end?: number;
}
/**
 * A piece of request/response data. Currently only base64-encoded
 * binary data, but may be expanded in the future to handle
 * websockets and other data stream types.
 */
export interface BodyData {
    /**
     * The inclusive start location of the data.
     */
    offset: number;
    /**
     * The length of the data.
     */
    length: number;
    /**
     * A string containing the data.
     */
    value: string;
}
/**
 * A piece of data from the request body.
 */
export interface RequestBodyData extends BodyData {
    /**
     * The point where the this piece of request data was sent, for example
     * if the request body was generated from a stream, or as many separate
     * websocket messages.
     */
    point?: TimeStampedPoint;
}
/**
 * A piece of data from the response body.
 */
export interface ResponseBodyData extends BodyData {
}
/**
 * The basic information about a request.
 */
export interface RequestInfo extends TimeStampedPoint {
    /**
     * The unique identifier for this request.
     */
    id: RequestId;
    /**
     * The point where the request was initiated. The same point may trigger
     * multiple requests, such as in the case of a request that redirects.
     */
    triggerPoint?: TimeStampedPoint;
}
/**
 * The basic information about events emitted by a request.
 */
export interface RequestEventInfo {
    /**
     * The unique identifier for the request this event
     * is associated with.
     */
    id: RequestId;
    /**
     * The time that the info appeared.
     */
    time: number;
    /**
     * Data about the event that occured.
     */
    event: RequestEvent;
}
/**
 * An HTTP header key/value pair.
 */
export interface Header {
    /**
     * The header name.
     */
    name: string;
    /**
     * The header value.
     */
    value: string;
}
/**
 * A tagged union type of all of the request events.
 * Use 'kind' to differentiate the events.
 */
export declare type RequestEvent = RequestOpenEvent | RequestRawHeaderEvent | RequestDestinationEvent | RequestResponseEvent | RequestResponseRawHeaderEvent | RequestDoneEvent | RequestBodyEvent | RequestFailedEvent | RequestResponseBodyEvent;
/**
 * An event representing the beginning of a request.
 */
export interface RequestOpenEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "request";
    /**
     * The URL being loaded by the request.
     */
    requestUrl: string;
    /**
     * The HTTP method used for the request.
     */
    requestMethod: string;
    /**
     * The HTTP headers sent with the request.
     */
    requestHeaders: Header[];
    /**
     * A short string identifying the cause of the request,
     * e.g. 'img', 'fetch', 'document', and so on
     */
    requestCause?: string;
}
/**
 * An event representing the request having sent raw headers.
 */
export interface RequestRawHeaderEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "request-raw-headers";
    /**
     * The raw HTTP header that was sent with the request.
     */
    requestRawHeaders: string;
}
/**
 * An event representing information about the request's destination.
 */
export interface RequestDestinationEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "request-destination";
    /**
     * The IP address of the destination.
     */
    destinationAddress: string;
    /**
     * The port number of the destination.
     */
    destinationPort: number;
}
/**
 * An event representing the response to a request being received.
 */
export interface RequestResponseEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "response";
    /**
     * The HTTP headers sent with the response.
     */
    responseHeaders: Header[];
    /**
     * The HTTP version of the response.
     */
    responseProtocolVersion: string;
    /**
     * The HTTP status code of the response.
     */
    responseStatus: number;
    /**
     * The HTTP status text of the response.
     */
    responseStatusText: string;
    /**
     * Indicates whether the response was served from cache.
     */
    responseFromCache: boolean;
}
/**
 * An event representing the response having received raw headers.
 */
export interface RequestResponseRawHeaderEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "response-raw-headers";
    /**
     * The raw HTTP header that was sent with the response.
     */
    responseRawHeaders: string;
}
/**
 * An event representing the presence of a response body for this
 * request, indicating a Network.getResponseBody command will not
 * throw an error for this request.
 */
export interface RequestResponseBodyEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "response-body";
}
/**
 * An event representing the presence of a request body for this
 * request, indicating a Network.getRequestBody command will not
 * throw an error for this request.
 */
export interface RequestBodyEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "request-body";
}
/**
 * An event representing the request having completed.
 */
export interface RequestDoneEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "request-done";
    /**
     * The number of bytes transferred for the body.
     */
    encodedBodySize: number;
    /**
     * The number of bytes after content decoding.
     * Null if the data didn't have a content-encoding.
     */
    decodedBodySize?: number;
}
/**
 * An event representing the request having failed.
 */
export interface RequestFailedEvent {
    /**
     * A tagged-union identifier for this event.
     */
    kind: "request-failed";
    /**
     * A short description of the cause of the failure.
     */
    requestFailedReason?: string;
}
export interface getRequestBodyParameters {
    /**
     * The id of the request to load.
     */
    id: RequestId;
    /**
     * The range of data to fetch from the body.
     */
    range?: BodyRange;
}
export interface getRequestBodyResult {
}
export interface getResponseBodyParameters {
    /**
     * The id of the request to load.
     */
    id: RequestId;
    /**
     * The range of data to fetch from the body.
     */
    range?: BodyRange;
}
export interface getResponseBodyResult {
}
export interface findRequestsParameters {
}
export interface findRequestsResult {
}
/**
 * Emit data about a request body as it is processed.
 * Parts are not guaranteed to be emitted in order.
 */
export interface requestBodyData {
    /**
     * The id of the request to the body belongs to.
     */
    id: RequestId;
    /**
     * Pieces of data belonging to the request body.
     */
    parts: RequestBodyData[];
}
/**
 * Emit data about a response body as it is processed.
 * Parts are not guaranteed to be emitted in order.
 */
export interface responseBodyData {
    /**
     * The id of the request to the body belongs to.
     */
    id: RequestId;
    /**
     * Pieces of data belonging to the response body.
     */
    parts: ResponseBodyData[];
}
/**
 * Describe some requests that were dispatched by the recording.
 *
 * NOTE: There is no guarantee that request information will be available
 * before the request event info, so all temporal combinations should be
 * supported when processing this data.
 */
export interface requests {
    /**
     * A list of requests found in the recording.
     */
    requests: RequestInfo[];
    /**
     * A list of request event data found in the recording.
     */
    events: RequestEventInfo[];
}
