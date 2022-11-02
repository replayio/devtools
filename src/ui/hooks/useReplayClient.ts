import type { Object } from "@replayio/protocol";
import { useContext, useEffect } from "react";

import { preCacheObject } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import { stringify } from "bvaughn-architecture-demo/src/utils/string";
import { Pause, ThreadFront } from "protocol/thread";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

/** 
 * This hook connects the legacy Replay app's usage of the protocol page
  to the ReplayClient used by newer components like the Object Inspector.
  It's meant to be the single place to manage the connection between the two.
  **NOTE**: This should only ever be called _once_, otherwise the setup is duplicated.
*/
export default function useConfigureReplayClientInterop() {
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

          preCacheObject(pauseId, object);
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
