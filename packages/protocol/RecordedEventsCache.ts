import {
  KeyboardEvent,
  MouseEvent,
  NavigationEvent as ProtocolNavigationEvent,
} from "@replayio/protocol";
import { createSingleEntryCache } from "suspense";

import { compareNumericStrings } from "protocol/utils";
import { replayClient } from "shared/client/ReplayClientContext";

// TODO [BAC-4618] Update the type definition in the protocol package
// This hack dates back to 2021 (github.com/replayio/devtools/pull/4713)
export type NavigationEvent = Omit<ProtocolNavigationEvent, "kind"> & {
  kind: "navigation";
};

export type RecordedEvent = MouseEvent | KeyboardEvent | NavigationEvent;

export async function preloadAllRecordedEventsCache(): Promise<void> {
  await Promise.all([
    RecordedEventsCache.readAsync(),
    RecordedClickEventsCache.readAsync(),
    RecordedKeyboardEventsCache.readAsync(),
    RecordedNavigationEventsCache.readAsync(),
    RecordedMouseEventsCache.readAsync(),
  ]);
}

export const RecordedEventsCache = createSingleEntryCache<[], RecordedEvent[]>({
  config: { immutable: true },
  debugLabel: "RecordedEventsCache",
  load: async () => {
    const [keyboardEvents, mouseEvents, navigationEvents] = await Promise.all([
      RecordedKeyboardEventsCache.readAsync(),
      RecordedMouseEventsCache.readAsync(),
      RecordedNavigationEventsCache.readAsync(),
    ]);

    const events = [...keyboardEvents, ...mouseEvents, ...navigationEvents];

    return events.sort((a, b) => compareNumericStrings(a.point, b.point));
  },
});

export const RecordedClickEventsCache = createSingleEntryCache<[], MouseEvent[]>({
  config: { immutable: true },
  debugLabel: "RecordedClickEventsCache",
  load: async () => {
    const events = await replayClient.findMouseEvents();

    // This is kind of funky but it's what Replay has always called a "click" event
    // github.com/replayio/devtools/commit/770952935755b67c8ea02f3aa1b4f0334ec22ee0
    return events.filter(event => event.kind === "mousedown");
  },
});

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
    const events = await replayClient.findNavigationEvents();
    return events.map(event => ({
      ...event,
      kind: "navigation",
    }));
  },
});
