import {
  ExecutionPoint,
  RequestBodyData,
  RequestBodyEvent,
  RequestDestinationEvent,
  RequestDoneEvent,
  RequestEventInfo,
  RequestFailedEvent,
  RequestId,
  RequestInfo,
  RequestOpenEvent,
  RequestRawHeaderEvent,
  RequestResponseBodyEvent,
  RequestResponseEvent,
  RequestResponseRawHeaderEvent,
  ResponseBodyData,
  TimeStampedPoint,
} from "@replayio/protocol";
import { transformSupplementalId } from "protocol/utils"
import { StreamingCacheLoadOptions, createStreamingCache } from "suspense";

import { comparePoints } from "protocol/execution-point-utils";
import { assert } from "protocol/utils";
import { ReplayClientInterface, TargetPoint } from "shared/client/types";

export type NetworkEventWithTime<EventType> = EventType & {
  time: number;
};

export type NetworkRequestsData = {
  id: RequestId;
  events: {
    bodyEvent: NetworkEventWithTime<RequestBodyEvent> | null;
    destinationEvent: NetworkEventWithTime<RequestDestinationEvent> | null;
    doneEvent: NetworkEventWithTime<RequestDoneEvent> | null;
    failedEvent: NetworkEventWithTime<RequestFailedEvent> | null;
    openEvent: NetworkEventWithTime<RequestOpenEvent> | null;
    rawHeaderEvent: NetworkEventWithTime<RequestRawHeaderEvent> | null;
    responseBodyEvent: NetworkEventWithTime<RequestResponseBodyEvent> | null;
    responseEvent: NetworkEventWithTime<RequestResponseEvent> | null;
    responseRawHeaderEvent: NetworkEventWithTime<RequestResponseRawHeaderEvent> | null;
  };
  timeStampedPoint: TimeStampedPoint;
  triggerPoint: TimeStampedPoint | null;
  targetPoint: TargetPoint | null;
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
    replayClient: ReplayClientInterface
  ) => {
    const { update, resolve } = options;

    const ids: RequestId[] = [];
    const records: Record<RequestId, NetworkRequestsData> = {};

    let previousExecutionPoint: ExecutionPoint | null = null;

    // Use the createOnRequestsReceived() adapter to ensure that RequestInfo objects
    // are always received before any associated RequestEventInfo objects
    const onRequestsReceived = createOnRequestsReceived(function onRequestsReceived(data) {
      data.requests.forEach(({ id, point, time, triggerPoint },) => {
        assert(
          previousExecutionPoint === null || comparePoints(previousExecutionPoint, point) <= 0,
          "Requests should be in order"
        );

        previousExecutionPoint = point;

        ids.push(id);

        const targetPoint = replayClient.getTargetPoint(point, 0);
        console.log(`TARGET`, transformSupplementalId(targetPoint?.point?.point ?? "", targetPoint?.supplementalIndex ?? 0))

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
          targetPoint: targetPoint ?? null,
          triggerPoint: triggerPoint ?? null,
        } as NetworkRequestsData;
      });

      data.events.forEach(({ event, id, time }) => {
        const record = records[id];
        const events = record.events;
        switch (event.kind) {
          case "request":
            events.openEvent = {
              ...event,
              time,
            };
            break;
          case "request-body":
            events.bodyEvent = {
              ...event,
              time,
            };
            break;
          case "request-destination":
            events.destinationEvent = {
              ...event,
              time,
            };
            break;
          case "request-done":
            events.doneEvent = {
              ...event,
              time,
            };
            // TODO
            break;
          case "request-failed":
            events.failedEvent = {
              ...event,
              time,
            };
            break;
          case "request-raw-headers":
            events.rawHeaderEvent = {
              ...event,
              time,
            };
            break;
          case "response":
            events.responseEvent = {
              ...event,
              time,
            };
            break;
          case "response-body":
            events.responseBodyEvent = {
              ...event,
              time,
            };
            // TODO
            break;
          case "response-raw-headers":
            events.responseRawHeaderEvent = {
              ...event,
              time,
            };
            break;
        }
      });

      update(ids, undefined, records);
    });

    await replayClient.findNetworkRequests(onRequestsReceived);

    onRequestsReceived.printWarnings();

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

    if (requestBodyData.length === 0) {
      update(requestBodyData);
    }

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

    if (responseBodyData.length === 0) {
      update(responseBodyData);
    }

    resolve();
  },
});

type DataEvent = { requests: RequestInfo[]; events: RequestEventInfo[] };

// Regarding the Network.findRequests protocol API, the docs state:
// There is no guarantee that request information will be available before the request event info,
// so all temporal combinations should be supported when processing this data.
//
// This method ensures that RequestInfo objects are always received before any associated
// RequestEventInfo objects, to simplify handling that data format.
function createOnRequestsReceived(onRequestsReceived: (data: DataEvent) => void) {
  const requestIdSet = new Set<RequestId>();
  const pendingRequestEventInfoArray: RequestEventInfo[] = [];

  function onRequestsReceivedWrapper(data: DataEvent) {
    // Track all RequestInfo ids that we've seen
    data.requests.forEach((requestInfo: RequestInfo) => {
      requestIdSet.add(requestInfo.id);
    });

    const events: RequestEventInfo[] = [];

    // Look for previous RequestEventInfos that are now safe to send
    for (let index = pendingRequestEventInfoArray.length - 1; index >= 0; index--) {
      const requestEventInfo = pendingRequestEventInfoArray[index];
      if (requestIdSet.has(requestEventInfo.id)) {
        events.push(requestEventInfo);
        pendingRequestEventInfoArray.splice(index, 1);
      }
    }

    // Pass along all new RequestEventInfo that are safe to send,
    // and hold on to the rest for later
    data.events.forEach(requestEventInfo => {
      if (requestIdSet.has(requestEventInfo.id)) {
        events.push(requestEventInfo);
      } else {
        pendingRequestEventInfoArray.push(requestEventInfo);
      }
    });

    onRequestsReceived({
      requests: data.requests,
      events,
    });
  }

  onRequestsReceivedWrapper.printWarnings = () => {
    if (pendingRequestEventInfoArray.length > 0) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `${pendingRequestEventInfoArray.length} unhandled RequestEventInfo objects found`
        );
        console.warn(pendingRequestEventInfoArray);
      }
    }
  };

  return onRequestsReceivedWrapper;
}
