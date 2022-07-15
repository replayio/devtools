import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { LogPointInstance } from "@bvaughn/src/contexts/LogPointsContext";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import { isEventTypeLog, isLogPointInstance } from "@bvaughn/src/utils/console";
import { Message as ProtocolMessage } from "@replayio/protocol";
import { ForwardedRef, forwardRef, MutableRefObject, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useFilteredMessagesDOM, { Loggable } from "./hooks/useFilteredMessagesDOM";
import useFocusRange from "./hooks/useFocusRange";
import styles from "./MessagesList.module.css";
import EventTypeRenderer from "./renderers/EventTypeRenderer";
import LogPointInstanceRenderer from "./renderers/LogPointInstanceRenderer";
import MessageRenderer from "./renderers/MessageRenderer";
import { SearchContext } from "./SearchContext";

// This is an approximation of the console; the UI isn't meant to be the focus of this branch.
// The primary purpose of this component is to showcase:
// 1. Using React Suspense (and Suspense caches) for just-in-time loading of Protocol data
// 2. Using an injected ReplayClientInterface to enable easy testing/mocking
function MessagesList({ forwardedRef }: { forwardedRef: ForwardedRef<HTMLElement> }) {
  const replayClient = useContext(ReplayClientContext);
  const [searchState] = useContext(SearchContext);
  ``;
  const loggables = useFilteredMessagesDOM(forwardedRef as MutableRefObject<HTMLElement>);
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

  return (
    <div
      className={isTransitionPending ? styles.ContainerPending : styles.Container}
      data-test-name="Messages"
      ref={forwardedRef as MutableRefObject<HTMLDivElement>}
      role="list"
    >
      {didOverflow && (
        <div className={styles.OverflowRow}>There were too many messages to fetch them all</div>
      )}
      {countBefore > 0 && (
        <div className={styles.CountRow}>
          {countBefore} messages filtered before the focus range
        </div>
      )}
      {loggables.length === 0 && <div className={styles.NoMessagesRow}>No messages found.</div>}
      {loggables.map((loggable: Loggable, index: number) =>
        isEventTypeLog(loggable) ? (
          <EventTypeRenderer
            key={index}
            isFocused={loggable === currentSearchResult}
            eventTypeLog={loggable}
          />
        ) : isLogPointInstance(loggable) ? (
          <LogPointInstanceRenderer
            key={index}
            isFocused={loggable === currentSearchResult}
            logPointInstance={loggable as LogPointInstance}
          />
        ) : (
          <MessageRenderer
            key={index}
            isFocused={loggable === currentSearchResult}
            message={loggable as ProtocolMessage}
          />
        )
      )}
      {countAfter > 0 && (
        <div className={styles.CountRow}>{countAfter} messages filtered after the focus range</div>
      )}
    </div>
  );
}

function MessagesListRefForwarder(_: Object, ref: ForwardedRef<HTMLElement>) {
  return <MessagesList forwardedRef={ref} />;
}

export default forwardRef(MessagesListRefForwarder);
