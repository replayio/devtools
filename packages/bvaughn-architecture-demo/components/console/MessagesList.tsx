import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { PointInstance } from "@bvaughn/src/contexts/PointsContext";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import { isEventTypeLog, isPointInstance } from "@bvaughn/src/utils/console";
import { Message as ProtocolMessage } from "@replayio/protocol";
import { ForwardedRef, forwardRef, MutableRefObject, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useFocusRange from "./hooks/useFocusRange";
import { Loggable, LoggablesContext } from "./LoggablesContext";
import styles from "./MessagesList.module.css";
import EventTypeRenderer from "./renderers/EventTypeRenderer";
import MessageRenderer from "./renderers/MessageRenderer";
import PointInstanceRenderer from "./renderers/PointInstanceRenderer";
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
        <div className={styles.OverflowRow}>There were too many messages to fetch them all</div>
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
        {loggables.length === 0 && <div className={styles.NoMessagesRow}>No messages found.</div>}
        {loggables.map((loggable: Loggable, index: number) => {
          if (isEventTypeLog(loggable)) {
            return (
              <EventTypeRenderer
                key={index}
                isFocused={loggable === currentSearchResult}
                eventTypeLog={loggable}
              />
            );
          } else if (isPointInstance(loggable)) {
            return (
              <PointInstanceRenderer
                key={index}
                isFocused={loggable === currentSearchResult}
                logPointInstance={loggable as PointInstance}
              />
            );
          } else {
            return (
              <MessageRenderer
                key={index}
                isFocused={loggable === currentSearchResult}
                message={loggable as ProtocolMessage}
              />
            );
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
