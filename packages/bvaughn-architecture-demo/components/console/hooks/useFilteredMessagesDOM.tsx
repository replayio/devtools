import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { PointInstance, PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { EventTypeLog, getEventTypeEntryPoints } from "@bvaughn/src/suspense/EventsCache";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import { getSourceIfAlreadyLoaded } from "@bvaughn/src/suspense/SourcesCache";
import { isEventTypeLog, isPointInstance } from "@bvaughn/src/utils/console";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { EventHandlerType, Message as ProtocolMessage } from "@replayio/protocol";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import { MutableRefObject, useContext, useEffect, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useFocusRange from "./useFocusRange";

export type Loggable = EventTypeLog | PointInstance | ProtocolMessage;

export default function useFilteredMessagesDOM(
  listRef: MutableRefObject<HTMLElement | null>
): Loggable[] {
  const client = useContext(ReplayClientContext);
  const { pointsForAnalysis: points } = useContext(PointsContext);
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

  // Trim eventTypeLogs and logPoints by focusRange.
  // Messages will have already been filtered from the backend.
  const focusedEventTypeLogs = useMemo<EventTypeLog[]>(() => {
    if (focusRange === null) {
      return eventTypeLogs;
    } else {
      return eventTypeLogs.filter(
        eventTypeLog =>
          eventTypeLog.time >= focusRange.begin.time && eventTypeLog.time <= focusRange.end.time
      );
    }
  }, [eventTypeLogs, focusRange]);

  const pointInstances = useMemo<PointInstance[]>(() => {
    const pointInstances: PointInstance[] = [];

    points.forEach(point => {
      if (point.enableLogging) {
        const hitPoints = getHitPointsForLocation(client, point.location, focusRange);
        if (hitPoints.length < MAX_POINTS_FOR_FULL_ANALYSIS) {
          hitPoints.forEach(hitPoint => {
            if (
              focusRange === null ||
              (hitPoint.time >= focusRange.begin.time && hitPoint.time <= focusRange.end.time)
            ) {
              pointInstances.push({
                point,
                timeStampedHitPoint: hitPoint,
              });
            }
          });
        }
      }
    });

    return pointInstances;
  }, [client, focusRange, points]);

  const sortedLoggables = useMemo<Loggable[]>(() => {
    const loggables: Loggable[] = [
      ...focusedEventTypeLogs,
      ...pointInstances,
      ...preFilteredMessages,
    ];
    return loggables.sort((a: Loggable, b: Loggable) => {
      return getTimeForSort(a) - getTimeForSort(b);
    });
  }, [focusedEventTypeLogs, pointInstances, preFilteredMessages]);

  useEffect(() => {
    const needle = filterByText.toLocaleLowerCase();
    const list = listRef.current!;
    list.childNodes.forEach((node: ChildNode, index: number) => {
      const element = node as HTMLElement;
      const textContent = element.textContent?.toLocaleLowerCase();
      const matches = textContent?.includes(needle);

      // HACK Style must be compatible with the visibility check in useConsoleSearchDOM()
      element.style.display = matches ? "inherit" : "none";
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
  } else if (isPointInstance(value)) {
    return value.timeStampedHitPoint.time;
  } else {
    return value.point.time;
  }
}
