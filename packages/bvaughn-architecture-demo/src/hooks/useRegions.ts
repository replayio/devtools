import { loadedRegions as LoadedRegions } from "@replayio/protocol";
import { useEffect, useSyncExternalStore } from "react";
import { ReplayClientInterface } from "shared/client/types";

import { preCacheExecutionPointForTime } from "../suspense/PointsCache";

export default function useRegions(client: ReplayClientInterface): LoadedRegions | null {
  const loadedRegions = useSyncExternalStore<LoadedRegions | null>(
    function subscribe(onStoreChange: () => void) {
      client.addEventListener("loadedRegionsChange", onStoreChange);
      return function unsubscribe() {
        client.removeEventListener("loadedRegionsChange", onStoreChange);
      };
    },
    function getSnapshot() {
      return client.loadedRegions;
    },
    function getServerSnapshot() {
      return client.loadedRegions;
    }
  );

  // Pre-cache loaded region points for faster lookup later.
  useEffect(() => {
    if (loadedRegions != null) {
      loadedRegions.loaded.forEach(({ begin, end }) => {
        preCacheExecutionPointForTime(begin);
        preCacheExecutionPointForTime(end);
      });
    }
  }, [loadedRegions]);

  return loadedRegions;
}
