import ContextMenuCategory from "replay-next/components/context-menu/ContextMenuCategory";
import ContextMenuDivider from "replay-next/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";

import styles from "./CommentDropDownMenu.module.css";

export default function CommentDropDownMenu() {
  const { filter, setFilter, setSortBy, sortBy } = useUserCommentPreferences();

  const { contextMenu, onContextMenu: onClick } = useContextMenu(
    <>
      <ContextMenuCategory>Show</ContextMenuCategory>
      <ContextMenuItem onClick={() => setFilter(null)}>
        <>
          <Icon
            className={styles.Icon}
            type={filter === null ? "checked-rounded" : "unchecked-rounded"}
          />{" "}
          All comments
        </>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setFilter("current-user")}>
        <>
          <Icon
            className={styles.Icon}
            type={filter === "current-user" ? "checked-rounded" : "unchecked-rounded"}
          />
          My comments
        </>
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuCategory>Sort by</ContextMenuCategory>
      <ContextMenuItem onClick={() => setSortBy("recording-time")}>
        <>
          <Icon
            className={styles.Icon}
            type={sortBy === "recording-time" ? "checked-rounded" : "unchecked-rounded"}
          />{" "}
          Recording time
        </>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setSortBy("created-at")}>
        <>
          <Icon
            className={styles.Icon}
            type={sortBy === "created-at" ? "checked-rounded" : "unchecked-rounded"}
          />
          Creation date
        </>
      </ContextMenuItem>
    </>
  );

  return (
    <>
      <button className={styles.Button} onClick={onClick}>
        <Icon className={styles.Icon} type="dots" />
      </button>
      {contextMenu}
    </>
  );
}
