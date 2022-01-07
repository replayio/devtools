import { RequestEventInfo, RequestInfo } from "@recordreplay/protocol";

export type NetworkState = {
  events: RequestEventInfo[];
  requests: RequestInfo[];
};
