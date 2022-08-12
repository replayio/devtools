import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { PointInstance, PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { TerminalContext, TerminalExpression } from "@bvaughn/src/contexts/TerminalContext";
import { getExceptions, UncaughtException } from "@bvaughn/src/suspense/AnalysisCache";
import { EventLog, getEventTypeEntryPoints } from "@bvaughn/src/suspense/EventsCache";
import { getMessages, ProtocolMessage } from "@bvaughn/src/suspense/MessagesCache";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import { loggableSort } from "@bvaughn/src/utils/loggables";
import { isInNodeModules } from "@bvaughn/src/utils/messages";
import { suspendInParallel } from "@bvaughn/src/utils/suspense";
import { isExecutionPointsWithinRange } from "@bvaughn/src/utils/time";
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

export type Loggable =
  | EventLog
  | PointInstance
  | ProtocolMessage
  | TerminalExpression
  | UncaughtException;

export const LoggablesContext = createContext<Loggable[]>(null as any);

// A "loggable" is anything that can be logged to the Console:
// * Messages logged to the Console API (e.g. console.log) while a recording is in progress.
// * Messages logged to the Replay Console terminal while viewing a recording.
// * Log points (e.g. break points with logging behavior enabled).
// * Events (e.g. "click") that have been toggled on by the user.

const EMPTY_ARRAY: any[] = [];

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

  const { range: focusRange } = useContext(FocusContext);

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
    return messages.filter((message: ProtocolMessage) => {
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

      // TODO This seems expensive; can we cache the message-to-node-modules relationship?
      if (!showNodeModules) {
        if (isInNodeModules(message)) {
          return false;
        }
      }

      return true;
    });
  }, [messages, showErrors, showLogs, showNodeModules, showWarnings]);

  // We may suspend based on this value, so let's this value changes at sync priority,
  let exceptions: UncaughtException[] = EMPTY_ARRAY;
  if (showExceptions) {
    exceptions = getExceptions(client);
  }

  // Trim eventLogs and logPoints by focusRange.
  // Messages will have already been filtered from the backend.
  const focusedEventLogs = useMemo<EventLog[]>(() => {
    if (focusRange === null) {
      return eventLogs;
    } else {
      return eventLogs.filter(eventLog =>
        isExecutionPointsWithinRange(eventLog.point, focusRange.begin.point, focusRange.end.point)
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
              isExecutionPointsWithinRange(
                hitPoint.point,
                focusRange.begin.point,
                focusRange.end.point
              )
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
      return terminalExpressions.filter(terminalExpression =>
        isExecutionPointsWithinRange(
          terminalExpression.point,
          focusRange.begin.point,
          focusRange.end.point
        )
      );
    }
  }, [focusRange, terminalExpressions]);

  const sortedLoggables = useMemo<Loggable[]>(() => {
    const loggables: Loggable[] = [
      ...exceptions,
      ...focusedEventLogs,
      ...pointInstances,
      ...preFilteredMessages,
      ...sortedTerminalExpressions,
    ];
    return loggables.sort(loggableSort);
  }, [
    exceptions,
    focusedEventLogs,
    pointInstances,
    preFilteredMessages,
    sortedTerminalExpressions,
  ]);

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
