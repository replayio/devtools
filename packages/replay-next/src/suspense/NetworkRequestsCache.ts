import {
  RequestBodyData,
  RequestEventInfo,
  RequestInfo,
  ResponseBodyData,
} from "@replayio/protocol";
import { createCache } from "suspense";

import { compareExecutionPoints } from "replay-next/src/utils/time";
import { ReplayClientInterface } from "shared/client/types";

export type NetworkRequestsCacheData = {
  requestEventInfo: RequestEventInfo[];
  requestInfo: RequestInfo[];
  responseBodyData: ResponseBodyData[];
  requestBodyData: RequestBodyData[];
};

export const networkRequestsCache = createCache<
  [replayClient: ReplayClientInterface],
  NetworkRequestsCacheData
>({
  debugLabel: "NetworkRequestsCache",
  load: async ([replayClient]) => {
    const requestEventInfo: RequestEventInfo[] = [];
    const requestInfo: RequestInfo[] = [];
    const responseBodyData: ResponseBodyData[] = [];
    const requestBodyData: RequestBodyData[] = [];

    await replayClient.findNetworkRequests(
      function onRequestsReceived(data) {
        requestEventInfo.push(...data.events);
        requestInfo.push(...data.requests);
      },
      function onResponseBodyData(data) {
        responseBodyData.push(...data.parts);
      },
      function onRequestBodyData(data) {
        requestBodyData.push(...data.parts);
      }
    );

    return {
      requestEventInfo: requestEventInfo.sort((a, b) => a.time - b.time),
      requestBodyData,
      requestInfo: requestInfo.sort((a, b) => compareExecutionPoints(a.point, b.point)),
      responseBodyData,
    };
  },
});
