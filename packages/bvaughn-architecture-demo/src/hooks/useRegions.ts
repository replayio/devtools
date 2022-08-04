import { loadedRegions as LoadedRegions } from "@replayio/protocol";
import { useSyncExternalStore } from "react";
import { ReplayClientInterface } from "shared/client/types";

export default function useLoadedRegions(client: ReplayClientInterface): LoadedRegions | null {
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
  return loadedRegions;
}
