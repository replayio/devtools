import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";

import styles from "./CommentCardsList.module.css";

export default function CommentFilterMenu() {
  const { filter, setFilter } = useUserCommentPreferences();

  const { contextMenu, onContextMenu: onClick } = useContextMenu(
    <>
      <ContextMenuItem onClick={() => setFilter(null)}>
        <>
          <Icon
            className={styles.ToolbarIcon}
            type={filter === null ? "checked-rounded" : "unchecked-rounded"}
          />{" "}
          All comments
        </>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setFilter("current-user")}>
        <>
          <Icon
            className={styles.ToolbarIcon}
            type={filter === "current-user" ? "checked-rounded" : "unchecked-rounded"}
          />
          My comments
        </>
      </ContextMenuItem>
    </>
  );

  return (
    <>
      <button className={styles.ToolbarIconButton} onClick={onClick}>
        <Icon className={styles.ToolbarIcon} type="filter" />
      </button>
      {contextMenu}
    </>
  );
}
