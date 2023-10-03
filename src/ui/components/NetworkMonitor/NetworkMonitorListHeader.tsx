import { LIST_ROW_HEIGHT } from "ui/components/NetworkMonitor/NetworkMonitorListRow";
import { useNetworkHeaderContextMenu } from "ui/components/NetworkMonitor/useNetworkHeaderContextMenu";
import {
  ColumnName,
  EnabledColumns,
  columnNames,
} from "ui/components/NetworkMonitor/useNetworkMonitorColumns";

import styles from "./NetworkMonitorListHeader.module.css";

export function NetworkMonitorListHeader({ columns }: { columns: EnabledColumns }) {
  const { contextMenu, onContextMenu } = useNetworkHeaderContextMenu();

  return (
    <div
      className={styles.HeaderRow}
      onContextMenu={onContextMenu}
      style={{
        height: LIST_ROW_HEIGHT,
      }}
    >
      <div className={styles.Column} data-name="time">
        Time
      </div>

      {columns.status && (
        <div className={styles.Column} data-name="status">
          Status
        </div>
      )}
      {columns.name && (
        <div className={styles.Column} data-name="name">
          Name
        </div>
      )}
      {columns.method && (
        <div className={styles.Column} data-name="method">
          Method
        </div>
      )}
      {columns.type && (
        <div className={styles.Column} data-name="type">
          Type
        </div>
      )}
      {columns.domain && (
        <div className={styles.Column} data-name="domain">
          Domain
        </div>
      )}
      {columns.path && (
        <div className={styles.Column} data-name="path">
          Path
        </div>
      )}
      {columns.url && (
        <div className={styles.Column} data-name="url">
          URL
        </div>
      )}

      {contextMenu}
    </div>
  );
}
