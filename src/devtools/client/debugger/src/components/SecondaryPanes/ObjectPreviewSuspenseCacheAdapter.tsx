import { preCacheObjects } from "@bvaughn/src/suspense/ObjectPreviews";
import { PauseData, PauseId } from "@replayio/protocol";
import { addPauseDataListener, removePauseDataListener } from "protocol/thread/pause";
import { useEffect } from "react";
import { useFeature } from "ui/hooks/settings";

// Connects legacy PauseData to the new Object Inspector Suspense cache.
// This avoids requiring the new Object Inspector to load redundant data,
// and also prevents potential runtime errors because of how the protocolValueToClientValue() utility works.
export default function ObjectPreviewSuspenseCacheAdapter() {
  const enableNewComponentArchitecture = useFeature("enableNewComponentArchitecture");

  useEffect(() => {
    if (!enableNewComponentArchitecture) {
      return;
    }

    const handler = (pauseId: PauseId, pauseData: PauseData) => {
      const { objects } = pauseData;
      if (objects) {
        // Be sure to clone object data before pre-caching it.
        // Otherwise ValueFronts might deeply mutate it and change its structure.
        preCacheObjects(pauseId, JSON.parse(JSON.stringify(objects)));
      }
    };

    addPauseDataListener(handler);
    return () => {
      removePauseDataListener(handler);
    };
  }, [enableNewComponentArchitecture]);

  return null;
}
