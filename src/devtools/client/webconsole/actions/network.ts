import { RequestInfo, RequestEventInfo, responseBodyData } from "@recordreplay/protocol";
import { ThreadFront } from "protocol/thread";
import { UIStore, UIThunkAction } from "ui/actions";
import {
  newNetworkRequests,
  newResponseBodyParts,
  newRequestBodyParts,
  networkRequestsLoaded,
} from "ui/actions/network";

let onResponseBodyPart: (responseBodyParts: responseBodyData) => void;

export const setupNetwork = async (store: UIStore) => {
  await ThreadFront.findNetworkRequests(
    async data => store.dispatch(onNetworkRequestsThunk(data)),
    async data => store.dispatch(newResponseBodyParts(data)),
    async data => store.dispatch(newRequestBodyParts(data))
  );
  store.dispatch(networkRequestsLoaded());
};

const onNetworkRequestsThunk =
  (data: { requests: RequestInfo[]; events: RequestEventInfo[] }): UIThunkAction =>
  async dispatch =>
    dispatch(newNetworkRequests(data));
