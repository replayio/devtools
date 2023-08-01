import { useMemo, useState, useSyncExternalStore } from "react";

import Expandable from "../Expandable";
import { getProtocolMessages, subscribe } from "./ProtocolMessagesStore";
import { getHeaderMessageRenderer, getMessageRenderer } from "./renderers";
import styles from "./ProtocolViewer.module.css";

export default function ProtocolViewer() {
  const [filterByText, setFilterByText] = useState("");

  const messages = useSyncExternalStore(
    onChange => subscribe(onChange),
    getProtocolMessages,
    getProtocolMessages
  );

  const filteredMessages = useMemo(() => {
    if (!filterByText) {
      return messages;
    } else {
      const isInverse = filterByText.startsWith("!") || filterByText.startsWith("-");
      const needle = isInverse
        ? filterByText.substring(1).toLowerCase()
        : filterByText.toLowerCase();

      // This is a really heavy-handed search but it's a DEV only feature so that's fine.
      return messages.filter(message => {
        const match = JSON.stringify(message).toLowerCase().includes(needle);
        return isInverse ? !match : match;
      });
    }
  }, [filterByText, messages]);

  return (
    <div className={styles.ProtocolViewer}>
      <div className={styles.Header}>Protocol</div>
      <input
        className={styles.SearchInput}
        onChange={({ target }) => setFilterByText(target.value)}
        placeholder="Filter messages ..."
        value={filterByText}
      />
      <div className={styles.List}>
        {filteredMessages.map((message, index) => (
          <Expandable
            childrenClassName={styles.ListItemChildren}
            className={styles.ListItem}
            header={getHeaderMessageRenderer(message)}
            headerClassName={styles.ListItemHeader}
            key={index}
          >
            {getMessageRenderer(message)}
          </Expandable>
        ))}
      </div>
    </div>
  );
}
