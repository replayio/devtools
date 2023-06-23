import { loadedRegions as LoadedRegions } from "@replayio/protocol";
import equal from "fast-deep-equal";
import { useContext, useEffect, useState } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { now } from "shared/utils/time";

// The backend doesn't give up on loading and indexing;
// It keeps trying until the entire session errors.
// Practically speaking though, there are cases where updates take so long it feels like things are broken.
// In that case the UI should show a visual indicator that the loading is slow.
//
// We can rely on the fact that even when loading takes a long time, we should still be getting regular progress updates.
// If too much time passes between these updates, we can infer that things are either slow,
// Or we're in a stuck state (aka an "error" for all practical purposes).
//
// If another update eventually comes in we will reset the slow/timed-out flag.

const CHECK_INTERVAL = 1_000;
const IS_SLOW_THRESHOLD = 10_000;

export function useLoadingIsSlow() {
  const replayClient = useContext(ReplayClientContext);

  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    let lastLoadChangeUpdateTime = now();
    let lastLoadedRegions: LoadedRegions | null = replayClient.loadedRegions;
    let timeoutId: NodeJS.Timeout | null = null;

    function checkLoadingStatus() {
      let isLoadingFinished = false;
      if (lastLoadedRegions !== null) {
        isLoadingFinished = equal(lastLoadedRegions.loading, lastLoadedRegions.indexed);
      }

      if (isLoadingFinished) {
        setIsSlow(false);
        return;
      }

      const currentTime = now();
      const elapsedTime = currentTime - lastLoadChangeUpdateTime;

      if (elapsedTime > IS_SLOW_THRESHOLD) {
        setIsSlow(true);
      } else {
        setIsSlow(false);
      }

      timeoutId = setTimeout(checkLoadingStatus, CHECK_INTERVAL);
    }

    checkLoadingStatus();

    const onLoadedRegionsChange = (loadedRegions: LoadedRegions) => {
      lastLoadChangeUpdateTime = now();
      lastLoadedRegions = loadedRegions;
    };

    replayClient.addEventListener("loadedRegionsChange", onLoadedRegionsChange);

    return () => {
      replayClient.removeEventListener("loadedRegionsChange", onLoadedRegionsChange);

      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
    };
  }, [replayClient]);

  return isSlow;
}
