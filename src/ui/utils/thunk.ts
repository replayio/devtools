import { ProtocolClient } from "@replayio/protocol";
import type { ThreadFront } from "protocol/thread";
import { ReplayClientInterface } from "shared/client/types";

export interface ThunkExtraArgs {
  ThreadFront: typeof ThreadFront;
  replayClient: ReplayClientInterface;
  protocolClient: ProtocolClient;
}

export const extraThunkArgs = {} as ThunkExtraArgs;
