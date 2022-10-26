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
  return <pre className={styles.Pre}>{JSON.stringify(message.error, null, 2)}</pre>;
}
