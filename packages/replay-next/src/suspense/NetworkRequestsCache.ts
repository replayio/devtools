import {
  ExecutionPoint,
  RequestBodyData,
  RequestEvent,
  RequestId,
  ResponseBodyData,
  TimeStampedPoint,
} from "@replayio/protocol";
import { createCache } from "suspense";

import { comparePoints } from "protocol/execution-point-utils";
import { assert } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

export type NetworkRequestsData = {
  id: RequestId;
  requestEvents: RequestEvent[];
  requestBodyData: RequestBodyData | null;
  responseBodyData: ResponseBodyData | null;
  timeStampedPoint: TimeStampedPoint;
  triggerPoint?: TimeStampedPoint;
};

export type NetworkRequestsCacheData = {
  ids: RequestId[];
  records: Record<RequestId, NetworkRequestsData>;
};

export const networkRequestsCache = createCache<
  [replayClient: ReplayClientInterface],
  NetworkRequestsCacheData
>({
  debugLabel: "NetworkRequestsCache",
  load: async ([replayClient]) => {
    const records: Record<RequestId, NetworkRequestsData> = {};
    const ids: RequestId[] = [];

    let previousExecutionPoint: ExecutionPoint | null = null;
    let requestBodyIndex = 0;
    let responseBodyIndex = 0;

    await replayClient.findNetworkRequests(
      function onRequestsReceived(data) {
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
      },
      function onResponseBodyData(data) {
        data.parts.forEach(responseBodyData => {
          const id = ids[responseBodyIndex];

          records[id].responseBodyData = responseBodyData;

          responseBodyIndex++;
        });
      },
      function onRequestBodyData(data) {
        data.parts.forEach(requestBodyData => {
          const id = ids[requestBodyIndex];

          records[id].requestBodyData = requestBodyData;

          requestBodyIndex++;
        });
      }
    );

    console.log(
      JSON.stringify(
        {
          ids,
          records,
        },
        null,
        2
      )
    );

    return {
      ids,
      records,
    };
  },
});
