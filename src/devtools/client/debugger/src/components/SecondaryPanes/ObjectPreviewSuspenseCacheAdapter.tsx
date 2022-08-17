import { preCacheObjects } from "@bvaughn/src/suspense/ObjectPreviews";
import { trackExecutionPointPauseIds } from "@bvaughn/src/suspense/PauseCache";
import { ExecutionPoint, PauseData, PauseId } from "@replayio/protocol";
import { addPauseDataListener, removePauseDataListener } from "protocol/thread/pause";
import { useLayoutEffect } from "react";
import { useFeature } from "ui/hooks/settings";

function createReplacer() {
  const cache = new Set();
  return function replacer(_: string, value: any): any {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        return undefined;
      }
      cache.add(value);
    }
    return value;
  };
}

// Connects legacy PauseData to the new Object Inspector Suspense cache.
// This avoids requiring the new Object Inspector to load redundant data,
// and also prevents potential runtime errors because of how the protocolValueToClientValue() utility works.
export default function ObjectPreviewSuspenseCacheAdapter() {
  const enableNewComponentArchitecture = useFeature("enableNewComponentArchitecture");

  // It's important to not miss pre-cached data because there's no way to access it after the fact.
  // So use a layout effect for subscription rather than a passive effect.
  useLayoutEffect(() => {
    if (!enableNewComponentArchitecture) {
      return;
    }

    const handler = (pauseId: PauseId, executionPoint: ExecutionPoint, pauseData: PauseData) => {
      const { objects } = pauseData;
      if (objects) {
        // Be sure to clone object data before pre-caching it.
        // Otherwise ValueFronts might deeply mutate it and change its structure.
        // Because object data may contain circular references, we need to also filter out empty entries.
        const cloned = JSON.parse(JSON.stringify(objects, createReplacer())).filter(Boolean);
        preCacheObjects(pauseId, cloned);
      }

      trackExecutionPointPauseIds(executionPoint, pauseId);
    };

    addPauseDataListener(handler);
    return () => {
      removePauseDataListener(handler);
    };
  }, [enableNewComponentArchitecture]);

  return null;
}
