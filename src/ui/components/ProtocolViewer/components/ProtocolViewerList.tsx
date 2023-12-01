import { useContext, useState } from "react";
import { ContextMenuItem, useContextMenu } from "use-context-menu";

import Icon from "replay-next/components/Icon";
import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";
import { ProtocolViewerListItem } from "ui/components/ProtocolViewer/components/ProtocolViewerListItem";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useGetUserInfo } from "ui/hooks/users";
import { getSessionId } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

import styles from "./ProtocolViewerList.module.css";

const ADMIN_APP_BASE_URL = "http://admin.replay.prod/sessions";

type FilterByCategory = "failed" | "pending" | "slow";

export function ProtocolViewerList() {
  const sessionId = useAppSelector(getSessionId);
  const {
    clearCurrentRequests,
    filterByCategory,
    filterByText: filterText,
    filteredRequestIds,
    updateFilterByCategory,
    updateFilterByText,
  } = useContext(ProtocolViewerContext);

  const { internal: isInternalUser } = useGetUserInfo();

  const { contextMenu, onContextMenu: onClickContextMenu } = useContextMenu(
    <>
      <ContextMenuItem onSelect={() => updateFilterByCategory(null)}>
        Show all messages
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => updateFilterByCategory("pending")}>
        Show only pending messages
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => updateFilterByCategory("failed")}>
        Show only failed messages
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => updateFilterByCategory("slow")}>
        Show only slow messages
      </ContextMenuItem>
    </>,
    {
      alignTo: "auto-target",
    }
  );

  let viewLogLink = null;
  if (isInternalUser) {
    viewLogLink = `${ADMIN_APP_BASE_URL}/${sessionId}`;
  }

  return (
    <div className={styles.ListPanel}>
      <h3 className={styles.Header}>
        Protocol Info
        {viewLogLink != null && (
          <a href={viewLogLink} rel="noreferrer noopener" target="_blank" title="View session logs">
            <MaterialIcon>launch</MaterialIcon>
          </a>
        )}
      </h3>

      <div className={styles.HeaderControls}>
        <div className={styles.FilterByTextWrapper}>
          <input
            className={styles.FilterInput}
            placeholder="Filter"
            value={filterText}
            onChange={event => updateFilterByText(event.target.value)}
          />

          <button
            className={styles.ClearButton}
            title="Clear protocol log"
            onClick={clearCurrentRequests}
          >
            <Icon className={styles.ClearIcon} type="hide" />
          </button>
        </div>

        <div className={styles.FilterByDropDown} onClick={onClickContextMenu}>
          <div className={styles.FilterByDropDownText}>
            {filterByCategory ? `Show only ${filterByCategory} messages` : "Show all messages"}
          </div>
          <Icon className={styles.FilterByDropDownIcon} type="chevron-down" />
        </div>
      </div>

      {contextMenu}

      <div className={styles.ProtocolCommands}>
        {filteredRequestIds.map(id => (
          <ProtocolViewerListItem id={id} key={id} />
        ))}
      </div>
    </div>
  );
}
