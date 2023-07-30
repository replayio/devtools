import { useMemo } from "react";

import JsonViewer from "replay-next/components/SyntaxHighlighter";

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
  const jsonText = useMemo(() => JSON.stringify(message.error, null, 2), [message.error]);

  return <JsonViewer className={styles.Pre} jsonText={jsonText} />;
}
