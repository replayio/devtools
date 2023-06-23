import { loadedRegions as LoadedRegions } from "@replayio/protocol";
import { useContext, useSyncExternalStore } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";

export default function useLoadedRegions(): LoadedRegions | null {
  const replayClient = useContext(ReplayClientContext);

  return useSyncExternalStore<LoadedRegions | null>(
    function subscribe(onStoreChange: () => void) {
      replayClient.addEventListener("loadedRegionsChange", onStoreChange);
      return function unsubscribe() {
        replayClient.removeEventListener("loadedRegionsChange", onStoreChange);
      };
    },
    function getSnapshot() {
      return replayClient.loadedRegions;
    },
    function getServerSnapshot() {
      return replayClient.loadedRegions;
    }
  );
}
