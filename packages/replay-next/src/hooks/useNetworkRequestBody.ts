import { RequestBodyData, RequestId } from "@replayio/protocol";
import { useContext } from "react";
import { useStreamingValue } from "suspense";

import { networkRequestBodyCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

export function useNetworkRequestBody(requestId: RequestId): RequestBodyData[] | null {
  const replayClient = useContext(ReplayClientContext);

  const stream = networkRequestBodyCache.stream(replayClient, requestId);
  const { value } = useStreamingValue(stream);

  return value ?? null;
}
