import { KeyboardEvent, MouseEvent, NavigationEvent } from "@replayio/protocol";
import { createCache } from "suspense";

import { replayClient } from "shared/client/ReplayClientContext";

export const RecordedKeyboardEventsCache = createCache<[], KeyboardEvent[]>({
  config: { immutable: true },
  debugLabel: "RecordedKeyboardEventsCache",
  getKey: () => ``, // Single entry cache
  load: async () => {
    return replayClient.findKeyboardEvents();
  },
});

export const RecordedMouseEventsCache = createCache<[], MouseEvent[]>({
  config: { immutable: true },
  debugLabel: "RecordedMouseEventsCache",
  getKey: () => ``, // Single entry cache
  load: async () => {
    return replayClient.findMouseEvents();
  },
});

export const RecordedNavigationEventsCache = createCache<[], NavigationEvent[]>({
  config: { immutable: true },
  debugLabel: "RecordedNavigationEventsCache",
  getKey: () => ``, // Single entry cache
  load: async () => {
    return replayClient.findNavigationEvents();
  },
});
