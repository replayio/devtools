import {
  ForwardedRef,
  MutableRefObject,
  ReactNode,
  Suspense,
  forwardRef,
  useContext,
  useMemo,
} from "react";

import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import Icon from "replay-next/components/Icon";
import Loader from "replay-next/components/Loader";
import { ConsoleFiltersContext } from "replay-next/src/contexts/ConsoleFiltersContext";
import { useMostRecentLoadedPause } from "replay-next/src/hooks/useMostRecentLoadedPause";
import { useStreamingMessages } from "replay-next/src/hooks/useStreamingMessages";
import {
  getLoggableExecutionPoint,
  isEventLog,
  isPointInstance,
  isProtocolMessage,
  isTerminalExpression,
  isUncaughtException,
} from "replay-next/src/utils/loggables";
import { isExecutionPointsLessThan } from "replay-next/src/utils/time";

import { ConsoleSearchContext } from "./ConsoleSearchContext";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import { Loggable, LoggablesContext } from "./LoggablesContext";
import EventLogRenderer from "./renderers/EventLogRenderer";
import LogPointRenderer from "./renderers/LogPointRenderer";
import MessageRenderer from "./renderers/MessageRenderer";
import TerminalExpressionRenderer from "./renderers/TerminalExpressionRenderer";
import UncaughtExceptionRenderer from "./renderers/UncaughtExceptionRenderer";
import styles from "./MessagesList.module.css";
import rendererStyles from "./renderers/shared.module.css";

type CurrentTimeIndicatorPlacement = Loggable | "begin" | "end";

const ErrorBoundary = ({ children }: { children: ReactNode }) => (
  <InlineErrorBoundary
    name="MessagesList"
    fallback={
      <div className={rendererStyles.Row}>
        <div className={rendererStyles.ErrorBoundaryFallback}>Something went wrong.</div>
      </div>
    }
  >
    {children}
  </InlineErrorBoundary>
);

// This is an approximation of the console; the UI isn't meant to be the focus of this branch.
// The primary purpose of this component is to showcase:
// 1. Using React Suspense (and Suspense caches) for just-in-time loading of Protocol data
// 2. Using an injected ReplayClientInterface to enable easy testing/mocking
function MessagesListSuspends({ forwardedRef }: { forwardedRef: ForwardedRef<HTMLElement> }) {
  const {
    filterByText,
    showErrors,
    showExceptions,
    showLogs,
    showNodeModules,
    showTimestamps,
    showWarnings,
  } = useContext(ConsoleFiltersContext);
  const { loggables, streamingStatus } = useContext(LoggablesContext);
  const [searchState] = useContext(ConsoleSearchContext);
  const { point: currentExecutionPoint } = useMostRecentLoadedPause() ?? {};

  // The Console should render a line indicating the current execution point.
  // This point might match multiple logs– or it might be between logs, or after the last log, etc.
  // This looking finds the best place to render the indicator.
  const currentTimeIndicatorPlacement = useMemo<CurrentTimeIndicatorPlacement | null>(() => {
    if (!currentExecutionPoint) {
      return null;
    }
    if (currentExecutionPoint === "0") {
      return "begin";
    }
    const nearestLoggable = loggables.find(loggable => {
      const executionPoint = getLoggableExecutionPoint(loggable);
      if (!isExecutionPointsLessThan(executionPoint, currentExecutionPoint)) {
        return true;
      }
    });
    return nearestLoggable || "end";
  }, [currentExecutionPoint, loggables]);

  const {
    messageMetadata: { countAfter, countBefore, didOverflow },
  } = useStreamingMessages();

  const currentSearchResult =
    searchState.query !== "" && searchState.results.length > 0
      ? searchState.results[searchState.index]
      : null;

  const currentTimeIndicator = <CurrentTimeIndicator key="CurrentTimeIndicator" />;
  const listItems: ReactNode[] = [];
  if (currentTimeIndicatorPlacement === "begin") {
    listItems.push(currentTimeIndicator);
  }
  loggables.forEach((loggable: Loggable, index: number) => {
    if (currentTimeIndicatorPlacement === loggable) {
      listItems.push(currentTimeIndicator);
    }

    if (isEventLog(loggable)) {
      listItems.push(
        <ErrorBoundary key={`event-${loggable.eventType}-${loggable.point}`}>
          <EventLogRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            eventLog={loggable}
          />
        </ErrorBoundary>
      );
    } else if (isPointInstance(loggable)) {
      listItems.push(
        <ErrorBoundary key={`logpoint-${loggable.point.key}-${loggable.timeStampedHitPoint.point}`}>
          <LogPointRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            logPointInstance={loggable}
          />
        </ErrorBoundary>
      );
    } else if (isProtocolMessage(loggable)) {
      listItems.push(
        <ErrorBoundary key={`message-${loggable.point.point}`}>
          <MessageRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            message={loggable}
          />
        </ErrorBoundary>
      );
    } else if (isTerminalExpression(loggable)) {
      listItems.push(
        <ErrorBoundary key={`evaluation-${loggable.id}`}>
          <TerminalExpressionRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            terminalExpression={loggable}
          />
        </ErrorBoundary>
      );
    } else if (isUncaughtException(loggable)) {
      listItems.push(
        <ErrorBoundary key={`exception-${loggable.point}`}>
          <UncaughtExceptionRenderer
            key={loggable.point}
            index={index}
            isFocused={loggable === currentSearchResult}
            uncaughtException={loggable}
          />
        </ErrorBoundary>
      );
    } else {
      throw Error("Unsupported loggable type");
    }
  });
  if (currentTimeIndicatorPlacement === "end") {
    listItems.push(currentTimeIndicator);
  }

  // Note that it's important to only render messages inside of the message lists.
  // Overflow notifications are displayed outside of the list, to avoid interfering with search.
  // See <LoggablesContextRoot> and useConsoleSearchDOM() for more info.
  return (
    <>
      {didOverflow && (
        <div className={styles.OverflowRow}>
          <Icon className={styles.OverflowRowIcon} type="warning" />
          <div>
            There are too many console messages so not all are being displayed.{" "}
            <a
              className={styles.OverflowLink}
              href="https://www.notion.so/replayio/Debugger-Limitations-5b33bb0e5bd1459cbd7daf3234219c27#8d72d62414a7490586ee5ac3adef09fb"
              target="_blank"
              rel="noreferrer noopener"
            >
              Read more
            </a>
          </div>
        </div>
      )}
      {countBefore > 0 && (
        <div className={styles.CountRow}>
          <span data-test-id="MessagesList-TrimmedBeforeCount">{countBefore}</span> messages
          filtered before the focus range
        </div>
      )}
      <div
        className={styles.Container}
        data-test-state-errors={showErrors ? true : undefined}
        data-test-state-exceptions={showExceptions ? true : undefined}
        data-test-state-filter-by-text={filterByText}
        data-test-state-logs={showLogs ? true : undefined}
        data-test-state-node-modules={showNodeModules ? true : undefined}
        data-test-state-search-by-text={searchState.query}
        data-test-state-cache-streaming-status={streamingStatus}
        data-test-state-timestamps={showTimestamps ? true : undefined}
        data-test-state-warnings={showWarnings ? true : undefined}
        data-test-name="Messages"
        ref={forwardedRef as MutableRefObject<HTMLDivElement>}
        role="list"
      >
        {listItems}
      </div>
      {countAfter > 0 && (
        <div className={styles.CountRow}>
          <span data-test-id="MessagesList-TrimmedAfterCount">{countAfter}</span> messages filtered
          after the focus range
        </div>
      )}
    </>
  );
}

function MessagesListRefForwarder(_: Object, ref: ForwardedRef<HTMLElement>) {
  return (
    <Suspense
      fallback={
        <div className={styles.Container}>
          <Loader />
        </div>
      }
    >
      <MessagesListSuspends forwardedRef={ref} />
    </Suspense>
  );
}

export default forwardRef(MessagesListRefForwarder);
