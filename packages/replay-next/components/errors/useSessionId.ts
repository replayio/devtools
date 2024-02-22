import { useSyncExternalStore } from "react";

import { ReplayClientInterface } from "shared/client/types";

export function useSessionId(replayClient: ReplayClientInterface) {
  return useSyncExternalStore(
    (change: () => void) => {
      replayClient.addEventListener("sessionCreated", change);
      return () => {
        replayClient.removeEventListener("sessionCreated", change);
      };
    },
    replayClient.getSessionId,
    replayClient.getSessionId
  );
}
