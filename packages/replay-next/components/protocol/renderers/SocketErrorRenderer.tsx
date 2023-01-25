import { useMemo } from "react";

import SyntaxHighlightedLine from "replay-next/components/sources/SyntaxHighlightedLine";

import { SocketError } from "../ProtocolMessagesStore";
import styles from "./shared.module.css";

export function SocketErrorHeaderRenderer({ message }: { message: SocketError }) {
  return (
    <>
      <span className={styles.HeaderPrimary}>Error</span>
      <small className={styles.HeaderSecondary}>({message.error})</small>
    </>
  );
}

export function SocketErrorRenderer({ message }: { message: SocketError }) {
  const code = useMemo(() => JSON.stringify(message.error, null, 2), [message.error]);

  return (
    <pre className={styles.Pre}>
      <SyntaxHighlightedLine code={code} fileExtension=".json" />
    </pre>
  );
}
