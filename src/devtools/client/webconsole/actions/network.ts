import { RequestInfo, RequestEventInfo } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { UIStore } from "ui/actions";
import { newNetworkRequestsAction, NEW_NETWORK_REQUESTS } from "ui/actions/network";
import { AppDispatch } from "ui/setup";

export const setupNetwork = (store: UIStore) => {
  ThreadFront.findNetworkRequests(async data => store.dispatch(onNetworkRequestsThunk(data)));
};

const onNetworkRequestsThunk =
  (data: { requests: RequestInfo[]; events: RequestEventInfo[] }) =>
  async ({ dispatch }: { dispatch: AppDispatch }) =>
    dispatch(newNetworkRequestsAction(data));
