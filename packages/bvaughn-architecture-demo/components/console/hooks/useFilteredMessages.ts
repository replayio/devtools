import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { PointInstance, PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { getCachedAnalysis } from "@bvaughn/src/suspense/AnalysisCache";
import { EventTypeLog, getEventTypeEntryPoints } from "@bvaughn/src/suspense/EventsCache";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import { getSourceIfAlreadyLoaded } from "@bvaughn/src/suspense/SourcesCache";
import { isEventTypeLog, isPointInstance } from "@bvaughn/src/utils/console";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import {
  EventHandlerType,
  Message as ProtocolMessage,
  Value as ProtocolValue,
} from "@replayio/protocol";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useFocusRange from "./useFocusRange";

export type Loggable = EventTypeLog | PointInstance | ProtocolMessage;

export default function useFilteredMessages(): Loggable[] {
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

  const filterByTextLowercase = filterByText.toLowerCase();

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

  const filteredEventTypeLogs = useMemo(() => {
    if (filterByTextLowercase === "") {
      return eventTypeLogs;
    }

    return eventTypeLogs.filter(eventTypeLog => {
      return (
        eventTypeLog.values.find((value: any) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(filterByTextLowercase);
          } else if (typeof value?.value === "string") {
            return value?.value?.toLowerCase()?.includes(filterByTextLowercase);
          }
        }) != null
      );
    });
  }, [eventTypeLogs, filterByTextLowercase]);

  const pointInstances = useMemo<PointInstance[]>(() => {
    const pointInstances: PointInstance[] = [];

    points.forEach(point => {
      if (point.enableLogging) {
        const hitPoints = getHitPointsForLocation(client, point.location, focusRange);
        if (hitPoints.length < MAX_POINTS_FOR_FULL_ANALYSIS) {
          hitPoints.forEach(hitPoint => {
            pointInstances.push({
              point,
              timeStampedHitPoint: hitPoint,
            });
          });
        }
      }
    });

    return pointInstances;
  }, [client, focusRange, points]);

  // If there is filterByText, it should apply to log points also.
  // We can only filter log points that either require no analysis or have already been analyzed.
  const filteredLogPoints = useMemo<PointInstance[]>(() => {
    if (filterByTextLowercase === "") {
      return pointInstances;
    }

    return pointInstances.filter(logPoint => {
      const analysis = getCachedAnalysis(
        logPoint.point.location,
        logPoint.timeStampedHitPoint,
        logPoint.point.content
      );

      if (!analysis) {
        // TRICKY
        // If we haven't run analysis on the point yet, we don't know whether it should be filtered or not.
        // Leave it in the filtered list so that it will load new data (Suspend) then we'll re-evaluate.
        return true;
      }

      // TODO (point) Do better filtering for non-string values
      return (
        analysis.values.find((value: any) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(filterByTextLowercase);
          } else if (typeof value?.value === "string") {
            return value?.value?.toLowerCase()?.includes(filterByTextLowercase);
          }
        }) != null
      );
    });
  }, [filterByTextLowercase, pointInstances]);

  const { messages } = getMessages(client, focusRange);

  // Filter in-focus messages by the current criteria.
  const filteredMessages = useMemo<ProtocolMessage[]>(() => {
    if (showErrors && showLogs && showNodeModules && showWarnings && filterByTextLowercase === "") {
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

        if (filterByTextLowercase !== "") {
          // TODO This is a hacky partial implementation of filter by text.
          if (message.text && message.text.toLowerCase().includes(filterByTextLowercase)) {
            return true;
          } else {
            if (message.argumentValues) {
              return message.argumentValues.find((argumentValue: ProtocolValue) => {
                if (
                  argumentValue.value &&
                  `${argumentValue.value}`.toLowerCase().includes(filterByTextLowercase)
                ) {
                  return true;
                }
              });
            }
          }

          return false;
        }

        return true;
      });
    }
  }, [
    filterByTextLowercase,
    messages,
    showErrors,
    showExceptions,
    showLogs,
    showNodeModules,
    showWarnings,
  ]);

  const sortedLoggables = useMemo<Loggable[]>(() => {
    const loggables: Loggable[] = [
      ...filteredEventTypeLogs,
      ...filteredLogPoints,
      ...filteredMessages,
    ];
    return loggables.sort((a: Loggable, b: Loggable) => {
      return getTimeForSort(a) - getTimeForSort(b);
    });
  }, [filteredEventTypeLogs, filteredLogPoints, filteredMessages]);

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
