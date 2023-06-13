import {
  ExecutionPoint,
  RequestBodyData,
  RequestBodyEvent,
  RequestDestinationEvent,
  RequestDoneEvent,
  RequestFailedEvent,
  RequestId,
  RequestOpenEvent,
  RequestRawHeaderEvent,
  RequestResponseBodyEvent,
  RequestResponseEvent,
  RequestResponseRawHeaderEvent,
  ResponseBodyData,
  TimeStampedPoint,
} from "@replayio/protocol";
import { StreamingCacheLoadOptions, createStreamingCache } from "suspense";

import { comparePoints } from "protocol/execution-point-utils";
import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

export type NetworkRequestsData = {
  id: RequestId;
  events: {
    bodyEvent: RequestBodyEvent | null;
    destinationEvent: RequestDestinationEvent | null;
    doneEvent: RequestDoneEvent | null;
    failedEvent: RequestFailedEvent | null;
    openEvent: RequestOpenEvent | null;
    rawHeaderEvent: RequestRawHeaderEvent | null;
    responseBodyEvent: RequestResponseBodyEvent | null;
    responseEvent: RequestResponseEvent | null;
    responseRawHeaderEvent: RequestResponseRawHeaderEvent | null;
  };
  timeStampedPoint: TimeStampedPoint;
  triggerPoint?: TimeStampedPoint;
};

export type NetworkRequestsCacheData = {
  ids: RequestId[];
  records: Record<RequestId, NetworkRequestsData>;
};

export const networkRequestsCache = createStreamingCache<
  [replayClient: ReplayClientInterface],
  RequestId[],
  Record<RequestId, NetworkRequestsData>
>({
  debugLabel: "NetworkRequestsCache",
  getKey: () => "single-entry-cache",
  load: async (
    options: StreamingCacheLoadOptions<RequestId[], Record<RequestId, NetworkRequestsData>>,
    replayClient
  ) => {
    const { update, resolve } = options;

    const records: Record<RequestId, NetworkRequestsData> = {};
    const ids: RequestId[] = [];

    let previousExecutionPoint: ExecutionPoint | null = null;

    await replayClient.findNetworkRequests(function onRequestsReceived(data) {
      data.requests.forEach(({ id, point, time, triggerPoint }) => {
        assert(
          previousExecutionPoint === null || comparePoints(previousExecutionPoint, point) <= 0,
          "Requests should be in order"
        );

        previousExecutionPoint = point;

        ids.push(id);

        records[id] = {
          id,
          events: {
            bodyEvent: null,
            destinationEvent: null,
            doneEvent: null,
            failedEvent: null,
            openEvent: null,
            rawHeaderEvent: null,
            responseBodyEvent: null,
            responseEvent: null,
            responseRawHeaderEvent: null,
          },
          requestBodyData: null,
          responseBodyData: null,
          timeStampedPoint: {
            point,
            time,
          },
          triggerPoint,
        } as NetworkRequestsData;
      });

      data.events.forEach(({ id, event }) => {
        const events = records[id].events;
        switch (event.kind) {
          case "request":
            events.openEvent = event;
            break;
          case "request-body":
            events.bodyEvent = event;
            break;
          case "request-destination":
            events.destinationEvent = event;
            break;
          case "request-done":
            events.doneEvent = event;
            break;
          case "request-failed":
            events.failedEvent = event;
            break;
          case "request-raw-headers":
            events.rawHeaderEvent = event;
            break;
        }
      });

      update(ids, undefined, records);
    });

    resolve();
  },
});

export const networkRequestBodyCache = createStreamingCache<
  [replayClient: ReplayClientInterface, requestId: RequestId],
  RequestBodyData[]
>({
  debugLabel: "NetworkRequestBodyCache",
  getKey: (replayClient, requestId) => requestId,
  load: async (options: StreamingCacheLoadOptions<RequestBodyData[]>, replayClient, requestId) => {
    const { update, resolve } = options;

    const requestBodyData: RequestBodyData[] = [];

    await replayClient.getNetworkRequestBody(requestId, data => {
      requestBodyData.push(...data.parts);

      update(requestBodyData);
    });

    resolve();
  },
});

export const networkResponseBodyCache = createStreamingCache<
  [replayClient: ReplayClientInterface, requestId: RequestId],
  ResponseBodyData[]
>({
  debugLabel: "NetworkResponseBodyCache",
  getKey: (replayClient, requestId) => requestId,
  load: async (options: StreamingCacheLoadOptions<ResponseBodyData[]>, replayClient, requestId) => {
    const { update, resolve } = options;

    const responseBodyData: ResponseBodyData[] = [];

    await replayClient.getNetworkResponseBody(requestId, data => {
      responseBodyData.push(...data.parts);

      update(responseBodyData);
    });

    resolve();
  },
});
