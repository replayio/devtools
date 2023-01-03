import { useMemo } from "react";

import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";

import { Event } from "../ProtocolMessagesStore";
import styles from "./shared.module.css";

export function EventHeaderRenderer({ message }: { message: Event }) {
  return (
    <>
      <span className={styles.HeaderPrimary}>Event</span>
      <small className={styles.HeaderSecondary}>({message.event.method})</small>
    </>
  );
}

export function EventRenderer({ message }: { message: Event }) {
  const code = useMemo(() => JSON.stringify(message.event.params, null, 2), [message]);
  return (
    <pre className={styles.Pre}>
      <SyntaxHighlightedLine code={code} fileExtension=".json" />
    </pre>
  );
}
