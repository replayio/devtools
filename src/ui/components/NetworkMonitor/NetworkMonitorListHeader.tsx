import { LIST_ROW_HEIGHT } from "ui/components/NetworkMonitor/NetworkMonitorListRow";

import styles from "./NetworkMonitorListHeader.module.css";

export function NetworkMonitorListHeader() {
  return (
    <div
      className={styles.HeaderRow}
      style={{
        height: LIST_ROW_HEIGHT,
      }}
    >
      <div className={styles.StatusColumn}>Status</div>
      <div className={styles.NameColumn}>Name</div>
      <div className={styles.MethodColumn}>Method</div>
      <div className={styles.TypeColumn}>Type</div>
      <div className={styles.DomainColumn}>Domain</div>
    </div>
  );
}
