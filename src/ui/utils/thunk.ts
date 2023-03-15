import { ProtocolClient } from "@replayio/protocol";

import type { ThreadFront } from "protocol/thread";
import type { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";

export interface ThunkExtraArgs {
  ThreadFront: typeof ThreadFront;
  replayClient: ReplayClientInterface;
  protocolClient: ProtocolClient;
  objectCache: typeof objectCache;
}

export const extraThunkArgs = {} as ThunkExtraArgs;
