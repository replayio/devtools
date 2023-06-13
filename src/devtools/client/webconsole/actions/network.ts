import { RequestEventInfo, RequestInfo } from "@replayio/protocol";

import { networkRequestsCache } from "replay-next/src/suspense/NetworkRequestsCache";
import { ReplayClientInterface } from "shared/client/types";
import { UIThunkAction } from "ui/actions";
import { newNetworkRequests } from "ui/actions/network";

export const setupNetwork = async (replayClient: ReplayClientInterface) => {
  networkRequestsCache.prefetch(replayClient);
};

const onNetworkRequestsThunk =
  (data: { requests: RequestInfo[]; events: RequestEventInfo[] }): UIThunkAction =>
  async dispatch =>
    dispatch(newNetworkRequests(data));
