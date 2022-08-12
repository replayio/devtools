import type { ThreadFront } from "protocol/thread";

export interface ThunkExtraArgs {
  ThreadFront: typeof ThreadFront;
}

export const extraThunkArgs = {} as ThunkExtraArgs;
