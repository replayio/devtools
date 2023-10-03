import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import {
  ColumnName,
  columnNames,
  useNetworkMonitorColumns,
} from "ui/components/NetworkMonitor/useNetworkMonitorColumns";

import styles from "./ContextMenu.module.css";

export function useNetworkHeaderContextMenu() {
  const [enableColumns, setEnableColumns] = useNetworkMonitorColumns();

  return useContextMenu(
    <>
      {Object.keys(columnNames).map(column => (
        <ContextMenuToggleItem
          column={column as ColumnName}
          enabled={enableColumns[column as ColumnName]}
          key={column}
          onChange={enabled =>
            setEnableColumns({
              ...enableColumns,
              [column]: enabled,
            })
          }
        />
      ))}
    </>,
    {
      dataTestName: "ContextMenu-NetworkRequestHeaders",
    }
  );
}

function ContextMenuToggleItem({
  column,
  enabled,
  onChange,
}: {
  column: ColumnName;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const name = columnNames[column];

  return (
    <ContextMenuItem onSelect={() => onChange(!enabled)}>
      <>
        {enabled ? (
          <Icon className={styles.SmallIcon} type="check" />
        ) : (
          <div className={styles.IconSpacer} />
        )}
        {name}
      </>
    </ContextMenuItem>
  );
}
