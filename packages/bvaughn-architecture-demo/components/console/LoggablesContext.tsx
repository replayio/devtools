import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { PointInstance, PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { TerminalContext, TerminalExpression } from "@bvaughn/src/contexts/TerminalContext";
import { EventLog, getEventTypeEntryPoints } from "@bvaughn/src/suspense/EventsCache";
import { getMessages, ProtocolMessage } from "@bvaughn/src/suspense/MessagesCache";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import { getSourceIfAlreadyLoaded } from "@bvaughn/src/suspense/SourcesCache";
import { loggableSort } from "@bvaughn/src/utils/loggables";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { EventHandlerType } from "@replayio/protocol";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import {
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
} from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useFocusRange from "./hooks/useFocusRange";

export type Loggable = EventLog | PointInstance | ProtocolMessage | TerminalExpression;

export const LoggablesContext = createContext<Loggable[]>(null as any);

// A "loggable" is anything that can be logged to the Console:
// * Messages logged to the Console API (e.g. console.log) while a recording is in progress.
// * Messages logged to the Replay Console terminal while viewing a recording.
// * Log points (e.g. break points with logging behavior enabled).
// * Events (e.g. "click") that have been toggled on by the user.

export function LoggablesContextRoot({
  children,
  messageListRef,
}: {
  children: ReactNode;
  messageListRef: MutableRefObject<HTMLElement | null>;
}) {
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
  const eventLogs = useMemo<EventLog[]>(() => {
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

  // Trim eventLogs and logPoints by focusRange.
  // Messages will have already been filtered from the backend.
  const focusedEventLogs = useMemo<EventLog[]>(() => {
    if (focusRange === null) {
      return eventLogs;
    } else {
      return eventLogs.filter(
        eventLog => eventLog.time >= focusRange.begin.time && eventLog.time <= focusRange.end.time
      );
    }
  }, [eventLogs, focusRange]);

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
                type: "PointInstance",
              });
            }
          });
        }
      }
    });

    return pointInstances;
  }, [client, focusRange, points]);

  const { messages: terminalExpressions } = useContext(TerminalContext);
  const sortedTerminalExpressions = useMemo(() => {
    if (focusRange === null) {
      return terminalExpressions;
    } else {
      return terminalExpressions.filter(
        terminalExpression =>
          terminalExpression.time >= focusRange.begin.time &&
          terminalExpression.time <= focusRange.end.time
      );
    }
  }, [focusRange, terminalExpressions]);

  const sortedLoggables = useMemo<Loggable[]>(() => {
    const loggables: Loggable[] = [
      ...focusedEventLogs,
      ...pointInstances,
      ...preFilteredMessages,
      ...sortedTerminalExpressions,
    ];
    return loggables.sort(loggableSort);
  }, [focusedEventLogs, pointInstances, preFilteredMessages, sortedTerminalExpressions]);

  const filterByLowerCaseText = filterByText.toLocaleLowerCase();

  // We leverage the DOM for display text filtering because it more closely mimics the browser's built in find-in-page functionality.
  // We could replace this by the search function from useConsoleSearch() and memoizing it, but it wouldn't work as well.
  useLayoutEffect(() => {
    const list = messageListRef.current;
    if (list !== null) {
      list.childNodes.forEach((node: ChildNode) => {
        const element = node as HTMLElement;

        if (element.hasAttribute("data-search-index")) {
          const textContent = element.textContent?.toLocaleLowerCase();
          const matches = textContent?.includes(filterByLowerCaseText);

          // HACK Style must be compatible with the visibility check in useConsoleSearchDOM()
          element.style.display = matches ? "inherit" : "none";
        }
      });
    }
  }, [filterByLowerCaseText, messageListRef, sortedLoggables]);

  return <LoggablesContext.Provider value={sortedLoggables}>{children}</LoggablesContext.Provider>;
}
