import { RequestEventInfo, RequestInfo } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";
import { UIStore, UIThunkAction } from "ui/actions";
import {
  networkRequestsLoaded,
  newNetworkRequests,
  newRequestBodyParts,
  newResponseBodyParts,
} from "ui/actions/network";

export const setupNetwork = async (store: UIStore, replayClient: ReplayClientInterface) => {
  await replayClient.findNetworkRequests(
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
