import {
  ExecutionPoint,
  RequestBodyData,
  RequestEvent,
  RequestId,
  ResponseBodyData,
  TimeStampedPoint,
} from "@replayio/protocol";
import { StreamingCacheLoadOptions, createStreamingCache } from "suspense";

import { comparePoints } from "protocol/execution-point-utils";
import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

export type NetworkRequestsData = {
  id: RequestId;
  requestEvents: RequestEvent[];
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
          requestEvents: [],
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
        records[id].requestEvents.push(event);
      });

      update(ids, undefined, records);
    });

    resolve();
  },
});

export const networkRequestBodyCache = createStreamingCache<
  [replayClient: ReplayClientInterface, requestId: RequestId],
  RequestBodyData[] | null
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
  ResponseBodyData[] | null
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
