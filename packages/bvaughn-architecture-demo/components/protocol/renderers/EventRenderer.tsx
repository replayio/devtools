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
  return <pre className={styles.Pre}>{JSON.stringify(message.event.params, null, 2)}</pre>;
}
