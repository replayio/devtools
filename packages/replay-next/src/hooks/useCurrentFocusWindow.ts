import { TimeStampedPointRange } from "@replayio/protocol";
import { useContext, useSyncExternalStore } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";

export function useCurrentFocusWindow(): TimeStampedPointRange | null {
  const replayClient = useContext(ReplayClientContext);

  return useSyncExternalStore(
    onChange => {
      replayClient.addEventListener("focusWindowChange", onChange);
      return () => {
        replayClient.removeEventListener("focusWindowChange", onChange);
      };
    },
    () => replayClient.getCurrentFocusWindow(),
    () => replayClient.getCurrentFocusWindow()
  );
}
