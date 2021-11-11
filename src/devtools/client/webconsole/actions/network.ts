import { RequestInfo, RequestEventInfo } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { NEW_NETWORK_REQUESTS } from "ui/actions/network";
import { AppDispatch } from "ui/setup";

export const setupNetwork = (store: any) => {
  ThreadFront.findNetworkRequests(data => store.dispatch(onNetworkRequestsThunk(data)));
};

const onNetworkRequestsThunk = (data: { requests: RequestInfo[]; events: RequestEventInfo[] }) => {
  async (dispatch: AppDispatch) => dispatch({ type: NEW_NETWORK_REQUESTS, payload: data });
};
