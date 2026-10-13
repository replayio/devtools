import { RequestBodyData, RequestId } from "@replayio/protocol";
import { useContext } from "react";

import { networkResponseBodyCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { useStreamingValue } from "suspense";

export function useNetworkResponseBody(requestId: RequestId): RequestBodyData[] | null {
  const replayClient = useContext(ReplayClientContext);

  const stream = networkResponseBodyCache.stream(replayClient, requestId);
  const { value } = useStreamingValue(stream);

  return value ?? null;
}
