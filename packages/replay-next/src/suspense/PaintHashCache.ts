import { ScreenShot } from "@replayio/protocol";
import { createExternallyManagedCache } from "suspense";

// The DOM.repaintGraphics API only returns screenshot data for a given paint hash once; see FE-2357
export const paintHashCache = createExternallyManagedCache<[paintHash: string], ScreenShot>({
  config: { immutable: true },
  debugLabel: "paintHashCache",
  getKey: ([paintHash]) => paintHash,
});
