import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";

import styles from "./CommentCardsList.module.css";

export default function CommentSortByMenu() {
  const { sortBy, setSortBy } = useUserCommentPreferences();

  const { contextMenu, onContextMenu: onClick } = useContextMenu(
    <>
      <ContextMenuItem onClick={() => setSortBy("recording-time")}>
        <>
          <Icon
            className={styles.ToolbarIcon}
            type={sortBy === "recording-time" ? "checked-rounded" : "unchecked-rounded"}
          />{" "}
          Recording time
        </>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setSortBy("created-at")}>
        <>
          <Icon
            className={styles.ToolbarIcon}
            type={sortBy === "created-at" ? "checked-rounded" : "unchecked-rounded"}
          />
          Created at
        </>
      </ContextMenuItem>
    </>
  );

  return (
    <>
      <button className={styles.ToolbarIconButton} onClick={onClick}>
        <Icon className={styles.ToolbarIcon} type="sort-ascending" />
      </button>
      {contextMenu}
    </>
  );
}
