import { RequestInfo, RequestEventInfo, responseBodyData } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { UIStore } from "ui/actions";
import { newNetworkRequests, newResponseBodyParts } from "ui/actions/network";
import { AppDispatch } from "ui/setup";

let onResponseBodyPart: (responseBodyParts: responseBodyData) => void;

export const setupNetwork = (store: UIStore) => {
  ThreadFront.findNetworkRequests(
    async data => store.dispatch(onNetworkRequestsThunk(data)),
    async data => store.dispatch(newResponseBodyParts(data))
  );
};

const onNetworkRequestsThunk =
  (data: { requests: RequestInfo[]; events: RequestEventInfo[] }) =>
  async ({ dispatch }: { dispatch: AppDispatch }) =>
    dispatch(newNetworkRequests(data));
