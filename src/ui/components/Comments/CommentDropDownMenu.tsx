import { UIEvent } from "react";
import {
  ContextMenuCategory,
  ContextMenuDivider,
  ContextMenuItem,
  useContextMenu,
} from "use-context-menu";

import { Checkbox } from "design";
import Icon from "replay-next/components/Icon";
import useUserCommentPreferences from "ui/components/Comments/useUserCommentPreferences";

import styles from "./CommentDropDownMenu.module.css";

function createSelectHandler(callback: () => void): (event: UIEvent) => void {
  return (event: UIEvent) => {
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
      <ContextMenuItem onSelect={createSelectHandler(() => setFilter(null))}>
        <Icon
          className={styles.Icon}
          data-selected={filter === null || undefined}
          type={filter === null ? "radio-selected" : "radio-unselected"}
        />{" "}
        Everyone
      </ContextMenuItem>
      <ContextMenuItem onSelect={createSelectHandler(() => setFilter("current-user"))}>
        <Icon
          className={styles.Icon}
          data-selected={filter === "current-user" || undefined}
          type={filter === "current-user" ? "radio-selected" : "radio-unselected"}
        />
        Only me
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuCategory>Sort by</ContextMenuCategory>
      <ContextMenuItem onSelect={createSelectHandler(() => setSortBy("recording-time"))}>
        <Icon
          className={styles.Icon}
          data-selected={sortBy === "recording-time" || undefined}
          type={sortBy === "recording-time" ? "radio-selected" : "radio-unselected"}
        />{" "}
        Recording time
      </ContextMenuItem>
      <ContextMenuItem onSelect={createSelectHandler(() => setSortBy("created-at"))}>
        <Icon
          className={styles.Icon}
          data-selected={sortBy === "created-at" || undefined}
          type={sortBy === "created-at" ? "radio-selected" : "radio-unselected"}
        />
        Creation date
      </ContextMenuItem>
      <ContextMenuDivider />
      <ContextMenuItem onSelect={createSelectHandler(() => setShowPreview(!showPreview))}>
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
