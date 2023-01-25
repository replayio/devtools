import { ProtocolClient } from "@replayio/protocol";

import type { ThreadFront } from "protocol/thread";
import type {
  getCachedObject,
  getObjectPropertyHelper,
  getObjectThrows,
  getObjectWithPreviewHelper,
} from "replay-next/src/suspense/ObjectPreviews";
import { ReplayClientInterface } from "shared/client/types";

interface SuspenseObjectCache {
  getCachedObject: typeof getCachedObject;
  getObjectThrows: typeof getObjectThrows;
  getObjectWithPreviewHelper: typeof getObjectWithPreviewHelper;
  getObjectPropertyHelper: typeof getObjectPropertyHelper;
}

export interface ThunkExtraArgs {
  ThreadFront: typeof ThreadFront;
  replayClient: ReplayClientInterface;
  protocolClient: ProtocolClient;
  objectCache: SuspenseObjectCache;
}

export const extraThunkArgs = {} as ThunkExtraArgs;
