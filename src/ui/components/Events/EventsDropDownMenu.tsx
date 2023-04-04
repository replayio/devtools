import { MouseEvent, useMemo, useTransition } from "react";

import { Badge, Checkbox } from "design";
import ContextMenuCategory from "replay-next/components/context-menu/ContextMenuCategory";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
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
        <Icon className={styles.Icon} type="dots" />
      </button>
      {contextMenu}
    </>
  );
}

function EventTypeContextMenuItem({ category, count }: { category: FiltersKey; count: number }) {
  const { filters, setFilters } = useEventsPreferences();
  const [isPending, startTransition] = useTransition();

  const enabled = filters[category] !== false;
  const checked = enabled && count > 0;

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
        <Checkbox className={styles.Checkbox} label={category} checked={checked} />
        {count > 0 && <Badge label={count} />}
      </div>
    </ContextMenuItem>
  );
}
