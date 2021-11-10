import { RequestInfo, RequestEventInfo } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";

export const setupNetwork = (store: any) => {
  ThreadFront.findNetworkRequests(({ requests, events }) => {
    store.dispatch(onNetworkRequestsThunk({ requests, events }));
  });
};

const onNetworkRequestsThunk = ({
  events,
  requests,
}: {
  events: RequestEventInfo[];
  requests: RequestInfo[];
}) => {
  return async ({ dispatch }: { dispatch: any }) => {
    dispatch({ type: "NEW_NETWORK_REQUESTS", payload: { requests, events } });
  };
};
