import { useSyncExternalStore } from "react";
import Expandable from "../Expandable";
import { getProtocolMessages, subscribe } from "./ProtocolMessagesStore";

import styles from "./ProtocolViewer.module.css";
import { getHeaderMessageRenderer, getMessageRenderer } from "./renderers";

export default function ProtocolViewer() {
  const protocolMessages = useSyncExternalStore(
    onChange => subscribe(onChange),
    getProtocolMessages,
    getProtocolMessages
  );
  return (
    <div className={styles.List}>
      {protocolMessages.map((message, index) => (
        <Expandable
          childrenClassName={styles.Children}
          className={styles.Item}
          header={getHeaderMessageRenderer(message)}
          headerClassName={styles.Header}
          key={index}
        >
          {getMessageRenderer(message)}
        </Expandable>
      ))}
    </div>
  );
}
