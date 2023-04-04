import { MouseEvent, useMemo, useTransition } from "react";

import ContextMenuCategory from "replay-next/components/context-menu/ContextMenuCategory";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getFilteredEventsForFocusRegion } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

import useEventsPreferences, { FiltersKey } from "./useEventsPreferences";
import styles from "./EventsDropDownMenu.module.css";

function createClickHandler(callback: () => void): (event: MouseEvent) => void {
  return (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    callback();
  };
}

export default function EventsDropDownMenu() {
  const events = useAppSelector(getFilteredEventsForFocusRegion);
  const eventCounts = useMemo<{ [key in FiltersKey]: number }>(
    () =>
      events.reduce(
        (counts, event) => {
          switch (event.kind) {
            case "keydown":
            case "keyup":
            case "keypress":
              counts.keyboard++;
              break;
            case "mousedown":
              counts.mouse++;
              break;
            case "navigation":
              counts.navigation++;
              break;
          }
          return counts;
        },
        {
          keyboard: 0,
          mouse: 0,
          navigation: 0,
        }
      ),
    [events]
  );

  const { filters, setFilters } = useEventsPreferences();

  const { contextMenu, onContextMenu: onClick } = useContextMenu(
    <>
      <ContextMenuCategory>Show events of type</ContextMenuCategory>
      {Object.entries(filters).map(([category, enabled]) => {
        return (
          <EventTypeContextMenuItem
            key={category}
            category={category as FiltersKey}
            count={eventCounts[category as FiltersKey]}
          />
        );
      })}
    </>
  );

  const onClickWrapper = (event: MouseEvent) => {
    onClick(event);

    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <button className={styles.DropDownButton} onClick={onClickWrapper}>
        <Icon className={styles.DropDownIcon} type="dots" />
      </button>
      {contextMenu}
    </>
  );
}

function EventTypeContextMenuItem({ category, count }: { category: FiltersKey; count: number }) {
  const { filters, setFilters } = useEventsPreferences();
  const [isPending, startTransition] = useTransition();

  const enabled = filters[category] !== false;

  let icon = null;
  switch (category) {
    case "keyboard":
      icon = "keyboard";
      break;
    case "mouse":
      icon = "ads_click";
      break;
    case "navigation":
      icon = "navigation";
      break;
  }

  return (
    <ContextMenuItem
      disabled={count === 0 || isPending}
      onClick={createClickHandler(() =>
        startTransition(() => {
          setFilters(prevFilters => ({
            ...prevFilters,
            [category]: !enabled,
          }));
        })
      )}
    >
      <div className={styles.MenuItem}>
        <MaterialIcon
          className={styles.MenuItemIcon}
          data-selected={(enabled && count > 0) || undefined}
          iconSize="xl"
        >
          {icon!}
        </MaterialIcon>
        {category}
        {count > 0 && <div className={styles.Count}>({count})</div>}
      </div>
    </ContextMenuItem>
  );
}
