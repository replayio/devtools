import { KeyboardEvent, MouseEvent, NavigationEvent } from "@replayio/protocol";
import { createSingleEntryCache } from "suspense";

import { replayClient } from "shared/client/ReplayClientContext";

export const RecordedKeyboardEventsCache = createSingleEntryCache<[], KeyboardEvent[]>({
  config: { immutable: true },
  debugLabel: "RecordedKeyboardEventsCache",
  load: async () => {
    return replayClient.findKeyboardEvents();
  },
});

export const RecordedMouseEventsCache = createSingleEntryCache<[], MouseEvent[]>({
  config: { immutable: true },
  debugLabel: "RecordedMouseEventsCache",
  load: async () => {
    return replayClient.findMouseEvents();
  },
});

export const RecordedNavigationEventsCache = createSingleEntryCache<[], NavigationEvent[]>({
  config: { immutable: true },
  debugLabel: "RecordedNavigationEventsCache",
  load: async () => {
    return replayClient.findNavigationEvents();
  },
});
