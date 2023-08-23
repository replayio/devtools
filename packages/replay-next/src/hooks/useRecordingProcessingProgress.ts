import { useContext, useSyncExternalStore } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";

export function useRecordingProcessingProgress() {
  const replayClient = useContext(ReplayClientContext);

  return useSyncExternalStore<number | null>(
    function subscribe(onStoreChange: () => void) {
      replayClient.addEventListener("processingProgressChange", onStoreChange);
      return function unsubscribe() {
        replayClient.removeEventListener("processingProgressChange", onStoreChange);
      };
    },
    function getSnapshot() {
      return replayClient.processingProgress;
    },
    function getServerSnapshot() {
      return replayClient.processingProgress;
    }
  );
}
