import { useContext, useEffect } from "react";

import { ThreadFront } from "protocol/thread";
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
}
