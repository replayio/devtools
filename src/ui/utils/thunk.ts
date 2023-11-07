import { ProtocolClient } from "@replayio/protocol";

import type { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";

export interface ThunkExtraArgs {
  replayClient: ReplayClientInterface;
  protocolClient: ProtocolClient;
  objectCache: typeof objectCache;
}

export const extraThunkArgs = {} as ThunkExtraArgs;
