import { MouseEvent } from "react";

import { Checkbox } from "design";
import ContextMenuCategory from "replay-next/components/context-menu/ContextMenuCategory";
import ContextMenuDivider from "replay-next/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";

import styles from "./CommentDropDownMenu.module.css";

function createClickHandler(callback: () => void): (event: MouseEvent) => void {
  return (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    callback();
  };
}

export default function CommentDropDownMenu() {
  const { filter, showPreview, setFilter, setShowPreview, setSortBy, sortBy } =
    useUserCommentPreferences();

  const { contextMenu, onContextMenu: onClick } = useContextMenu(
    <>
      <ContextMenuCategory>Show comments by</ContextMenuCategory>
      <ContextMenuItem onClick={createClickHandler(() => setFilter(null))}>
        <Icon
          className={styles.Icon}
          data-selected={filter === null || undefined}
          type={filter === null ? "radio-selected" : "radio-unselected"}
        />{" "}
        Everyone
      </ContextMenuItem>
      <ContextMenuItem onClick={createClickHandler(() => setFilter("current-user"))}>
        <Icon
          className={styles.Icon}
          data-selected={filter === "current-user" || undefined}
          type={filter === "current-user" ? "radio-selected" : "radio-unselected"}
        />
        Only me
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuCategory>Sort by</ContextMenuCategory>
      <ContextMenuItem onClick={createClickHandler(() => setSortBy("recording-time"))}>
        <Icon
          className={styles.Icon}
          data-selected={sortBy === "recording-time" || undefined}
          type={sortBy === "recording-time" ? "radio-selected" : "radio-unselected"}
        />{" "}
        Recording time
      </ContextMenuItem>
      <ContextMenuItem onClick={createClickHandler(() => setSortBy("created-at"))}>
        <Icon
          className={styles.Icon}
          data-selected={sortBy === "created-at" || undefined}
          type={sortBy === "created-at" ? "radio-selected" : "radio-unselected"}
        />
        Creation date
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuItem onClick={createClickHandler(() => setShowPreview(!showPreview))}>
        <Checkbox checked={showPreview} className={styles.Checkbox} label="Show preview?" />
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
