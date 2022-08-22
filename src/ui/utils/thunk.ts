import type { ThreadFront } from "protocol/thread";
import { ReplayClientInterface } from "shared/client/types";

export interface ThunkExtraArgs {
  ThreadFront: typeof ThreadFront;
  replayClient: ReplayClientInterface;
}

export const extraThunkArgs = {} as ThunkExtraArgs;
