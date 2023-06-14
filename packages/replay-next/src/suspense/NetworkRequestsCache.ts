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
  triggerPoint: TimeStampedPoint | null;
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

    const getOrCreateRecord = (id: RequestId) => {
      if (records[id] == null) {
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
          // assert() this is filled in before returning
          timeStampedPoint: null as any,
          triggerPoint: null,
        } as NetworkRequestsData;
      }

      return records[id];
    };

    await replayClient.findNetworkRequests(function onRequestsReceived(data) {
      // From the protocol docs:
      // There is no guarantee that request information will be available before the request event info,
      // so all temporal combinations should be supported when processing this data.
      data.requests.forEach(({ id, point, time, triggerPoint }) => {
        assert(
          previousExecutionPoint === null || comparePoints(previousExecutionPoint, point) <= 0,
          "Requests should be in order"
        );

        previousExecutionPoint = point;

        ids.push(id);

        const record = getOrCreateRecord(id);
        record.timeStampedPoint = {
          point,
          time,
        };
        record.triggerPoint = triggerPoint ?? null;
      });

      data.events.forEach(({ id, event }) => {
        const record = getOrCreateRecord(id);
        const events = record.events;
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

    // Verify that all required fields were eventually filled in
    for (let id in records) {
      const record = records[id];
      assert(record.timeStampedPoint !== null);
    }

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
