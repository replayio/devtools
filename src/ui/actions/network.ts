import { RequestInfo, RequestEventInfo } from "@recordreplay/protocol";

export const NEW_NETWORK_REQUESTS = "NEW_NETWORK_REQUESTS";

type NewNetworkRequestsAction = {
  type: "NEW_NETWORK_REQUESTS";
  payload: { requests: RequestInfo[]; events: RequestEventInfo[] };
};

export type NetworkAction = NewNetworkRequestsAction;

export const newNetworkRequestsAction = ({
  requests,
  events,
}: {
  requests: RequestInfo[];
  events: RequestEventInfo[];
}): NewNetworkRequestsAction => ({
  type: "NEW_NETWORK_REQUESTS",
  payload: { requests, events },
});
