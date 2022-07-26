import { preCacheObjects } from "@bvaughn/src/suspense/ObjectPreviews";
import { PauseData, PauseId } from "@replayio/protocol";
import { addPauseDataListener, removePauseDataListener } from "protocol/thread/pause";
import { useEffect } from "react";
import { useFeature } from "ui/hooks/settings";

// Connects legacy PauseData to the new Object Inspector Suspense cache.
// This avoids requiring the new Object Inspector to load redundant data,
// and also prevents potential runtime errors because of how the protocolValueToClientValue() utility works.
export default function ObjectPreviewSuspenseCacheAdapter() {
  const enableNewObjectInspector = useFeature("enableNewObjectInspector");

  useEffect(() => {
    if (!enableNewObjectInspector) {
      return;
    }

    const handler = (pauseId: PauseId, pauseData: PauseData) => {
      const { objects } = pauseData;
      if (objects) {
        preCacheObjects(pauseId, objects);
      }
    };

    addPauseDataListener(handler);
    return () => {
      removePauseDataListener(handler);
    };
  }, [enableNewObjectInspector]);

  return null;
}
