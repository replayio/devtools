import { RequestInfo, RequestEventInfo } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";

export const setupNetwork = (store: any) => {
  ThreadFront.findConsoleMessages((_, msg) => store.dispatch(onNetworkRequests(msg)));
};

const onNetworkRequests = ({
  requests,
  events,
}: {
  requests: RequestInfo[];
  events: RequestEventInfo[];
}) => {
  return async ({ dispatch }) => {
    dispatch(addNetworkRequests(requests, events));
  };
};
