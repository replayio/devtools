import { formatDuration } from "@bvaughn/src/utils/time";
import { RequestResponse } from "../ProtocolMessagesStore";

import styles from "./shared.module.css";

export function RequestResponseHeaderRenderer({ message }: { message: RequestResponse }) {
  let status = "Loading";
  if (message.error !== null) {
    status = "Failed";
  } else if (message.duration !== null) {
    status = formatDuration(message.duration);
  }

  return (
    <>
      <span className={styles.HeaderPrimary}>{message.request.method}</span>
      <small className={styles.HeaderSecondary}>({status})</small>
    </>
  );
}

export function RequestResponseRenderer({ message }: { message: RequestResponse }) {
  return (
    <div>
      <div className={styles.SubHeader}>
        Request <small>({message.request.id})</small>
      </div>
      <pre className={styles.Pre}>{JSON.stringify(message.request.params, null, 2)}</pre>
      {message.error && (
        <>
          <div className={styles.SubHeader}>Error</div>
          <pre className={styles.Pre}>{JSON.stringify(message.error, null, 2)}</pre>
        </>
      )}
      {message.response && (
        <>
          <div className={styles.SubHeader}>Response</div>
          <pre className={styles.Pre}>{JSON.stringify(message.response.result, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
