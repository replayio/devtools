import { ConsoleFiltersContext } from "@bvaughn/src/contexts/ConsoleFiltersContext";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { getMessages } from "@bvaughn/src/suspense/MessagesCache";
import { Message } from "@replayio/protocol";
import { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import useFocusRange from "./hooks/useFocusRange";
import MessageRenderer from "./MessageRenderer";
import styles from "./MessagesList.module.css";
import { SearchContext } from "./SearchContext";

// This is an approximation of the console; the UI isn't meant to be the focus of this branch.
// The primary purpose of this component is to showcase:
// 1. Using React Suspense (and Suspense caches) for just-in-time loading of Protocol data
// 2. Using an injected ReplayClientInterface to enable easy testing/mocking
export default function MessagesList() {
  const replayClient = useContext(ReplayClientContext);
  const [searchState] = useContext(SearchContext);

  const { filteredMessages } = useContext(ConsoleFiltersContext);
  const { isTransitionPending: isFocusTransitionPending } = useContext(FocusContext);

  const focusRange = useFocusRange();

  // TRICKY
  // Message filtering is done client-side, but overflow/counts are server-side so it comes from Suspense.
  const { countAfter, countBefore, didOverflow } = getMessages(replayClient, focusRange);

  // This component only needs to render a pending UI when a focus changes,
  // because this might require an async backend request.
  // Filter text changes are always processed synchronously by useFilteredMessages(),
  // so dimming the UI would just cause a short flicker which we can avoid.
  const isTransitionPending = isFocusTransitionPending;

  const currentSearchResult =
    searchState.query !== "" && searchState.results.length > 0
      ? searchState.results[searchState.index]
      : null;

  return (
    <div
      className={isTransitionPending ? styles.ContainerPending : styles.Container}
      data-test-id="Messages"
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
      {filteredMessages.length === 0 && (
        <div className={styles.NoMessagesRow}>No messages found.</div>
      )}
      {filteredMessages.map((message: Message, index: number) => (
        <MessageRenderer
          key={index}
          isFocused={message === currentSearchResult}
          message={message}
        />
      ))}
      {countAfter > 0 && (
        <div className={styles.CountRow}>{countAfter} messages filtered after the focus range</div>
      )}
    </div>
  );
}
