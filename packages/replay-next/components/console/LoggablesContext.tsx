import { EventHandlerType, Message } from "@replayio/protocol";
import {
  MutableRefObject,
  ReactNode,
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
} from "react";
import { Status } from "suspense";

import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { PointInstance } from "replay-next/src/contexts/points/types";
import { TerminalContext, TerminalExpression } from "replay-next/src/contexts/TerminalContext";
import { useStreamingMessages } from "replay-next/src/hooks/useStreamingMessages";
import { EventLog, getInfallibleEventPointsSuspense } from "replay-next/src/suspense/EventsCache";
import {
  UncaughtException,
  getInfallibleExceptionPointsSuspense,
} from "replay-next/src/suspense/ExceptionsCache";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { loggableSort } from "replay-next/src/utils/loggables";
import { isInNodeModules } from "replay-next/src/utils/messages";
import { suspendInParallel } from "replay-next/src/utils/suspense";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { POINT_BEHAVIOR_ENABLED } from "shared/client/types";
import { toPointRange } from "shared/utils/time";

export type ProtocolMessage = Message & {
  type: "ProtocolMessage";
};

export type Loggable =
  | EventLog
  | PointInstance
  | ProtocolMessage
  | TerminalExpression
  | UncaughtException;

export const LoggablesContext = createContext<{
  loggables: Loggable[];
  streamingStatus: Status;
}>(null as any);

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
  const { messages, status } = useStreamingMessages();

  const protocolMessages = useMemo<ProtocolMessage[]>(
    () =>
      messages.map(message => ({
        ...message,
        type: "ProtocolMessage",
      })),
    [messages]
  );

  return (
    <LoggablesContextInner
      children={children}
      messageListRef={messageListRef}
      messages={protocolMessages}
      streamingStatus={status}
    />
  );
}

function LoggablesContextInner({
  children,
  messageListRef,
  messages,
  streamingStatus,
}: {
  children: ReactNode;
  messageListRef: MutableRefObject<HTMLElement | null>;
  messages: ProtocolMessage[];
  streamingStatus: Status;
}) {
  const client = useContext(ReplayClientContext);
  const { pointBehaviorsForSuspense: pointBehaviors, pointsForSuspense: points } =
    useContext(PointsContext);
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
  const focusedEventLogs = useMemo<EventLog[]>(() => {
    if (!focusRange) {
      return [];
    }
    return suspendInParallel(
      ...eventTypesToLoad.map(
        eventType => () =>
          getInfallibleEventPointsSuspense(
            BigInt(focusRange.begin.point),
            BigInt(focusRange.end.point),
            client,
            eventType
          ) ?? []
      )
    ).flat();
  }, [client, eventTypesToLoad, focusRange]);

  // Pre-filter in-focus messages by non text based search criteria.
  const preFilteredMessages = useMemo<ProtocolMessage[]>(() => {
    if (messages === null) {
      return EMPTY_ARRAY;
    }

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
  if (focusRange && showExceptions) {
    // TODO This isn't a safe time to suspend; there are hooks below
    exceptions =
      getInfallibleExceptionPointsSuspense(
        BigInt(focusRange.begin.point),
        BigInt(focusRange.end.point),
        client
      ) ?? EMPTY_ARRAY;
  }

  const pointInstances = useMemo<PointInstance[]>(() => {
    if (!focusRange) {
      return [];
    }

    const pointInstances: PointInstance[] = [];

    points.forEach(point => {
      const pointBehavior = pointBehaviors[point.key];
      if (pointBehavior?.shouldLog === POINT_BEHAVIOR_ENABLED) {
        // TODO This isn't a safe time to suspend (inside of useMemo())
        const [hitPoints, status] = hitPointsForLocationCache.read(
          client,
          toPointRange(focusRange),
          point.location,
          point.condition
        );

        switch (status) {
          case "too-many-points-to-find":
          case "too-many-points-to-run-analysis": {
            // Don't try to render log points if there are too many hits.
            break;
          }
          default: {
            hitPoints.forEach(hitPoint => {
              pointInstances.push({
                point,
                timeStampedHitPoint: hitPoint,
                type: "PointInstance",
              });
            });
            break;
          }
        }
      }
    });

    return pointInstances;
  }, [client, pointBehaviors, points, focusRange]);

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

  const context = useMemo(
    () => ({
      loggables: sortedLoggables,
      streamingStatus,
    }),
    [sortedLoggables, streamingStatus]
  );

  const filterByLowerCaseText = filterByText.toLocaleLowerCase();

  // We leverage the DOM for display text filtering because it more closely mimics the browser's built in find-in-page functionality.
  // We could replace this by the search function from useConsoleSearch() and memoizing it, but it wouldn't work as well.
  useLayoutEffect(() => {
    const list = messageListRef.current;
    if (list !== null) {
      const filter = () => {
        list.childNodes.forEach((node: ChildNode) => {
          const element = node as HTMLElement;

          if (element.hasAttribute("data-search-index")) {
            const textContent = element.textContent?.toLocaleLowerCase();
            const matches = textContent?.includes(filterByLowerCaseText);

            // HACK Style must be compatible with the visibility check in useConsoleSearchDOM()
            element.style.display = matches ? "inherit" : "none";
          }
        });
      };

      const observer = new MutationObserver(filter);
      observer.observe(list, { childList: true, subtree: true });

      filter();

      return () => observer.disconnect();
    }
  }, [filterByLowerCaseText, messageListRef, sortedLoggables]);

  return <LoggablesContext.Provider value={context}>{children}</LoggablesContext.Provider>;
}
