import { Message } from "@replayio/protocol";
import { useContext } from "react";

import { ConsoleFiltersContext, FocusContext, ReplayClientContext } from "../../src/contexts";
import useFilteredMessages from "../../src/hooks/useFilteredMessages";
import { getMessages } from "../../src/suspense/MessagesCache";
import { getClosestPointForTime } from "../../src/suspense/PointsCache";

import MessageRenderer from "./MessageRenderer";
import styles from "./MessagesList.module.css";

// This is a crappy approximation of the console; the UI isn't meant to be the focus of this branch.
// The primary purpose of this component is to showcase:
// 1. The getMessages() Suspense cache for just-in-time loading of console data
// 2. The memoized useFilteredMessages() selector for computing derived (merged, sorted, and filtered) data
//
// Note that the props passed from the parent component would more likely be exposed through Context in a real app.
// We're passing them as props in this case since the parent and child are right beside each other in the tree.
export default function MessagesList() {
  const replayClient = useContext(ReplayClientContext);

  const { filterByText, levelFlags } = useContext(ConsoleFiltersContext);
  const { range, isTransitionPending: isFocusTransitionPending } = useContext(FocusContext);

  let focusRange = null;
  if (range !== null) {
    const [startTime, endTime] = range;

    const startPoint = getClosestPointForTime(replayClient, startTime);
    const endPoint = getClosestPointForTime(replayClient, endTime);

    focusRange = {
      begin: {
        point: startPoint,
        time: startTime,
      },
      end: {
        point: endPoint,
        time: endTime,
      },
    };
  }

  const { countAfter, countBefore, didOverflow, messages } = getMessages(replayClient, focusRange);

  // Memoized selector that joins log points and messages and filters by criteria (e.g. type)
  // Note that we are intentionally not storing derived values like this in state.
  const filteredMessages = useFilteredMessages(messages, {
    ...levelFlags,
    filterByText,
  });

  // This component only needs to render a pending UI when a focus changes,
  // because this might require an async backend request.
  // Filter text changes are always processed synchronously by useFilteredMessages(),
  // so dimming the UI would just cause a short flicker which we can avoid.
  const isTransitionPending = isFocusTransitionPending;

  return (
    <div className={isTransitionPending ? styles.ContainerPending : styles.Container}>
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
        <MessageRenderer key={index} message={message} />
      ))}
      {countAfter > 0 && (
        <div className={styles.CountRow}>{countAfter} messages filtered after the focus range</div>
      )}
    </div>
  );
}
