import Icon from "@bvaughn/components/Icon";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { Nag } from "@bvaughn/src/graphql/types";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import {
  getLoggableExecutionPoint,
  isEventLog,
  isPointInstance,
  isProtocolMessage,
  isTerminalExpression,
  isUncaughtException,
} from "@bvaughn/src/utils/loggables";
import { isExecutionPointsLessThan, isExecutionPointsWithinRange } from "@bvaughn/src/utils/time";
import {
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  MutableRefObject,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { Loggable, LoggablesContext } from "./LoggablesContext";
import styles from "./MessagesList.module.css";
import EventLogRenderer from "./renderers/EventLogRenderer";
import MessageRenderer from "./renderers/MessageRenderer";
import LogPointRenderer from "./renderers/LogPointRenderer";
import TerminalExpressionRenderer from "./renderers/TerminalExpressionRenderer";
import UncaughtExceptionRenderer from "./renderers/UncaughtExceptionRenderer";
import { ConsoleSearchContext } from "./ConsoleSearchContext";
import useLoadedRegions from "@bvaughn/src/hooks/useRegions";
import { isPointInRegions } from "shared/utils/time";
import CurrentTimeIndicator from "./CurrentTimeIndicator";

type CurrentTimeIndicatorPlacement = Loggable | "begin" | "end";

// This is an approximation of the console; the UI isn't meant to be the focus of this branch.
// The primary purpose of this component is to showcase:
// 1. Using React Suspense (and Suspense caches) for just-in-time loading of Protocol data
// 2. Using an injected ReplayClientInterface to enable easy testing/mocking
function MessagesList({ forwardedRef }: { forwardedRef: ForwardedRef<HTMLElement> }) {
  const { isTransitionPending: isFocusTransitionPending, range: focusRange } =
    useContext(FocusContext);
  const loggables = useContext(LoggablesContext);
  const replayClient = useContext(ReplayClientContext);
  const [searchState] = useContext(ConsoleSearchContext);
  const { executionPoint: currentExecutionPoint } = useContext(TimelineContext);
  const { currentUserInfo } = useContext(SessionContext);
  const loadedRegions = useLoadedRegions(replayClient);

  // The Console should render a line indicating the current execution point.
  // This point might match multiple logs– or it might be between logs, or after the last log, etc.
  // This looking finds the best place to render the indicator.
  const currentTimeIndicatorPlacement = useMemo<CurrentTimeIndicatorPlacement>(() => {
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

  // TRICKY
  // Message filtering is done client-side, but overflow/counts are server-side so it comes from Suspense.
  const { countAfter, countBefore, didOverflow } = getMessages(replayClient, focusRange);

  // This component only needs to render a pending UI when a focus changes,
  // because this might require an async backend request.
  // Filter text changes are always processed synchronously,
  // so dimming the UI would just cause a short flicker which we can avoid.
  const isTransitionPending = isFocusTransitionPending;

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

    const loggableExecutionPoint = getLoggableExecutionPoint(loggable);
    const isLoaded =
      loadedRegions !== null && isPointInRegions(loggableExecutionPoint, loadedRegions.loaded);
    const shouldShowConsoleNag = currentUserInfo?.nags.includes(Nag.FIRST_CONSOLE_NAVIGATE);
    const initialIsHovered = Boolean(shouldShowConsoleNag && index === 0);

    if (isLoaded) {
      if (isEventLog(loggable)) {
        listItems.push(
          <EventLogRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            eventLog={loggable}
            initialIsHovered={initialIsHovered}
          />
        );
      } else if (isPointInstance(loggable)) {
        listItems.push(
          <LogPointRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            logPointInstance={loggable}
            initialIsHovered={initialIsHovered}
          />
        );
      } else if (isProtocolMessage(loggable)) {
        listItems.push(
          <MessageRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            message={loggable}
            initialIsHovered={initialIsHovered}
          />
        );
      } else if (isTerminalExpression(loggable)) {
        listItems.push(
          <TerminalExpressionRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            terminalExpression={loggable}
            initialIsHovered={initialIsHovered}
          />
        );
      } else if (isUncaughtException(loggable)) {
        listItems.push(
          <UncaughtExceptionRenderer
            key={index}
            index={index}
            isFocused={loggable === currentSearchResult}
            uncaughtException={loggable}
            initialIsHovered={initialIsHovered}
          />
        );
      } else {
        throw Error("Unsupported loggable type");
      }
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
        className={isTransitionPending ? styles.ContainerPending : styles.Container}
        data-test-name="Messages"
        ref={forwardedRef as MutableRefObject<HTMLDivElement>}
        role="list"
        tabIndex={0}
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
  return <MessagesList forwardedRef={ref} />;
}

export default forwardRef(MessagesListRefForwarder);
