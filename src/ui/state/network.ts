import { RequestEventInfo, RequestInfo } from "@replayio/protocol";

export type NetworkState = {
  events: RequestEventInfo[];
  requests: RequestInfo[];
  selectedRequestId: string | null;
};
