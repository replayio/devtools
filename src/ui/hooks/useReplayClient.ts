import { preCacheObject } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import { stringify } from "bvaughn-architecture-demo/src/utils/string";
import { Pause, ThreadFront } from "protocol/thread";
import { useContext, useEffect } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

// This hook connects the legacy Replay app's usage of the protocol page
// to the ReplayClient used by newer components like the Object Inspector.
// It's meant to be the single place to manage the connection between the two.
export default function useReplayClient() {
  const replayClient = useContext(ReplayClientContext);

  // Wire up the ReplayClient used for the new Object Inspector component.
  useEffect(() => {
    async function initSession() {
      const sessionId = await ThreadFront.waitForSession();
      replayClient.configure(sessionId!);
    }
    initSession();
  }, [replayClient]);

  // HACK
  // Pass data (from Pause) through to the Suspense cache used by the Object Inspector.
  // This is required because the new ReplayClient isn't being used to fetch the data.
  useEffect(() => {
    const set = new Set<Object>();

    let currentPause: Pause | null = null;

    function onPauseObjects(objects: Object[]) {
      const pauseId = currentPause!.pauseId!;

      objects.forEach((object: Object) => {
        if (!set.has(object)) {
          set.add(object);

          // Deeply clone object data before pre-caching it.
          // The Pause class mutates these values by adding ValueFronts to them.
          preCacheObject(pauseId, JSON.parse(stringify(object)));
        }
      });
    }

    async function onThreadCurrentPause(pause: Pause | null) {
      if (currentPause !== null) {
        currentPause.off("objects", onPauseObjects);
      }

      currentPause = pause;

      if (pause != null) {
        pause.on("objects", onPauseObjects);
      }
    }

    ThreadFront.on("currentPause", onThreadCurrentPause);

    return () => {
      ThreadFront.off("currentPause", onThreadCurrentPause);

      if (currentPause !== null) {
        currentPause.off("objects", onPauseObjects);
      }
    };
  }, []);
}
