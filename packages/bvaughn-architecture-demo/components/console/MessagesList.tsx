import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import {
  isEventLog,
  isPointInstance,
  isProtocolMessage,
  isTerminalExpression,
} from "@bvaughn/src/utils/console";
import { ForwardedRef, forwardRef, MutableRefObject, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import Icon from "../Icon";

import useFocusRange from "./hooks/useFocusRange";
import { Loggable, LoggablesContext } from "./LoggablesContext";
import styles from "./MessagesList.module.css";
import EventLogRenderer from "./renderers/EventLogRenderer";
import MessageRenderer from "./renderers/MessageRenderer";
import PointInstanceRenderer from "./renderers/PointInstanceRenderer";
import TerminalExpressionRenderer from "./renderers/TerminalExpressionRenderer";
import { SearchContext } from "./SearchContext";

// This is an approximation of the console; the UI isn't meant to be the focus of this branch.
// The primary purpose of this component is to showcase:
// 1. Using React Suspense (and Suspense caches) for just-in-time loading of Protocol data
// 2. Using an injected ReplayClientInterface to enable easy testing/mocking
function MessagesList({ forwardedRef }: { forwardedRef: ForwardedRef<HTMLElement> }) {
  const replayClient = useContext(ReplayClientContext);
  const [searchState] = useContext(SearchContext);
  const loggables = useContext(LoggablesContext);
  const { isTransitionPending: isFocusTransitionPending } = useContext(FocusContext);

  const focusRange = useFocusRange();

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
          {countBefore} messages filtered before the focus range
        </div>
      )}
      <div
        className={isTransitionPending ? styles.ContainerPending : styles.Container}
        data-test-name="Messages"
        ref={forwardedRef as MutableRefObject<HTMLDivElement>}
        role="list"
      >
        {loggables.map((loggable: Loggable, index: number) => {
          if (isEventLog(loggable)) {
            return (
              <EventLogRenderer
                key={index}
                isFocused={loggable === currentSearchResult}
                eventLog={loggable}
              />
            );
          } else if (isPointInstance(loggable)) {
            return (
              <PointInstanceRenderer
                key={index}
                isFocused={loggable === currentSearchResult}
                logPointInstance={loggable}
              />
            );
          } else if (isProtocolMessage(loggable)) {
            return (
              <MessageRenderer
                key={index}
                isFocused={loggable === currentSearchResult}
                message={loggable}
              />
            );
          } else if (isTerminalExpression(loggable)) {
            return (
              <TerminalExpressionRenderer
                key={index}
                isFocused={loggable === currentSearchResult}
                terminalExpression={loggable}
              />
            );
          } else {
            throw Error("Unsupported loggable type");
          }
        })}
      </div>
      {countAfter > 0 && (
        <div className={styles.CountRow}>{countAfter} messages filtered after the focus range</div>
      )}
    </>
  );
}

function MessagesListRefForwarder(_: Object, ref: ForwardedRef<HTMLElement>) {
  return <MessagesList forwardedRef={ref} />;
}

export default forwardRef(MessagesListRefForwarder);
