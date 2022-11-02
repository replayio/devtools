import { SocketWillClose } from "../ProtocolMessagesStore";
import styles from "./shared.module.css";

export function SocketWillCloseHeaderRenderer({ message }: { message: SocketWillClose }) {
  return (
    <>
      <span className={styles.HeaderPrimary}>SocketWillClose</span>
      <small className={styles.HeaderSecondary}>({message.willClose ? "true" : "false"})</small>
    </>
  );
}

export function SocketWillCloseRenderer({ message }: { message: SocketWillClose }) {
  return null;
}
