import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { LogPointInstance, LogPointsContext } from "@bvaughn/src/contexts/LogPointsContext";
import { EventTypeLog, getEventTypeEntryPoints } from "@bvaughn/src/suspense/EventsCache";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import { getSourceIfAlreadyLoaded } from "@bvaughn/src/suspense/SourcesCache";
import { isEventTypeLog, isLogPointInstance } from "@bvaughn/src/utils/console";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { EventHandlerType, Message as ProtocolMessage } from "@replayio/protocol";
import { MutableRefObject, useContext, useEffect, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useFocusRange from "./useFocusRange";

export type Loggable = EventTypeLog | LogPointInstance | ProtocolMessage;

// TODO Can we use "content-visbility" to leave them in the DOM, but shown/hidden for filtering purposes?
export default function useFilteredMessagesDOM(
  listRef: MutableRefObject<HTMLElement | null>
): Loggable[] {
  const client = useContext(ReplayClientContext);
  const logPoints = useContext(LogPointsContext);
  const {
    eventTypes,
    filterByText,
    showErrors,
    showExceptions,
    showLogs,
    showNodeModules,
    showWarnings,
  } = useContext(ConsoleFiltersContext);

  const focusRange = useFocusRange();

  // Find the set of event type handlers we should be displaying in the console.
  const eventTypesToLoad = useMemo<EventHandlerType[]>(() => {
    const filteredEventHandlerTypes: EventHandlerType[] = [];
    for (let [eventType, enabled] of Object.entries(eventTypes)) {
      if (enabled) {
        filteredEventHandlerTypes.push(eventType);
      }
    }
    return filteredEventHandlerTypes;
  }, [eventTypes]);

  // Load the event type data from the protocol and flatten into a single array (to be filtered and sorted below).
  const eventTypeLogs = useMemo<EventTypeLog[]>(() => {
    return suspendInParallel(
      ...eventTypesToLoad.map(eventType => () => getEventTypeEntryPoints(client, eventType))
    ).flat();
  }, [client, eventTypesToLoad]);

  const { messages } = getMessages(client, focusRange);

  // Pre-filter in-focus messages by non text based search criteria.
  const preFilteredMessages = useMemo<ProtocolMessage[]>(() => {
    if (showErrors && showLogs && showNodeModules && showWarnings) {
      return messages;
    } else {
      return messages.filter((message: ProtocolMessage) => {
        switch (message.source) {
          case "ConsoleAPI": {
            switch (message.level) {
              case "warning": {
                if (!showWarnings) {
                  return false;
                }
                break;
              }
              case "error": {
                if (!showErrors) {
                  return false;
                }
                break;
              }
              default: {
                if (!showLogs) {
                  return false;
                }
                break;
              }
            }
            break;
          }
          case "PageError": {
            if (!showExceptions) {
              return false;
            }
            break;
          }
        }

        // TODO This seems expensive; can we cache the message-to-node-modules relationship?
        if (!showNodeModules) {
          const isNodeModules = message.data.frames?.some(frame => {
            const sourceId = frame.location?.[0].sourceId;
            const source = sourceId ? getSourceIfAlreadyLoaded(sourceId) : null;
            if (source) {
              return source.url?.includes("node_modules") || source.url?.includes("unpkg.com");
            }
            return false;
          });
          if (isNodeModules) {
            return false;
          }
        }

        return true;
      });
    }
  }, [messages, showErrors, showExceptions, showLogs, showNodeModules, showWarnings]);

  const sortedLoggables = useMemo<Loggable[]>(() => {
    const loggables: Loggable[] = [...eventTypeLogs, ...logPoints, ...preFilteredMessages];
    return loggables.sort((a: Loggable, b: Loggable) => {
      return getTimeForSort(a) - getTimeForSort(b);
    });
  }, [eventTypeLogs, logPoints, preFilteredMessages]);

  useEffect(() => {
    const needle = filterByText.toLocaleLowerCase();
    const list = listRef.current!;
    list.childNodes.forEach((node: ChildNode, index: number) => {
      const element = node as HTMLElement;
      const textContent = element.textContent?.toLocaleLowerCase();
      element.style.display = textContent?.includes(needle) ? "inherit" : "none";
    });
  }, [
    filterByText,
    listRef,
    showErrors,
    showExceptions,
    showLogs,
    showNodeModules,
    showWarnings,
    sortedLoggables,
  ]);

  return sortedLoggables;
}

function getTimeForSort(value: Loggable): number {
  if (isEventTypeLog(value)) {
    return value.time;
  } else if (isLogPointInstance(value)) {
    return value.timeStampedHitPoint.time;
  } else {
    return value.point.time;
  }
}
