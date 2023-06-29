import { MouseEvent, UIEvent, useMemo, useTransition } from "react";
import { ContextMenuCategory, ContextMenuItem, useContextMenu } from "use-context-menu";

import { Badge, Checkbox } from "design";
import Icon from "replay-next/components/Icon";
import { ConsoleEventFilterPreferencesKey } from "shared/preferences/types";
import { getFilteredEventsForFocusWindow } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

import useEventsPreferences from "./useEventsPreferences";
import styles from "./EventsDropDownMenu.module.css";

function createSelectHandler(callback: () => void): (event: UIEvent) => void {
  return (event: UIEvent) => {
    event.preventDefault();
    event.stopPropagation();

    callback();
  };
}

export default function EventsDropDownMenu() {
  const events = useAppSelector(getFilteredEventsForFocusWindow);
  const eventCounts = useMemo<{ [key in ConsoleEventFilterPreferencesKey]: number }>(
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

  const { filters } = useEventsPreferences();

  const { contextMenu, onContextMenu: onClick } = useContextMenu(
    <>
      <ContextMenuCategory>Show events of type</ContextMenuCategory>
      {Object.entries(filters).map(([category, enabled]) => {
        return (
          <EventTypeContextMenuItem
            key={category}
            category={category as ConsoleEventFilterPreferencesKey}
            count={eventCounts[category as ConsoleEventFilterPreferencesKey]}
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

function EventTypeContextMenuItem({
  category,
  count,
}: {
  category: ConsoleEventFilterPreferencesKey;
  count: number;
}) {
  const { filters, setFilters } = useEventsPreferences();
  const [isPending, startTransition] = useTransition();

  const enabled = filters[category] !== false;
  const checked = enabled && count > 0;

  return (
    <ContextMenuItem
      disabled={count === 0 || isPending}
      onSelect={createSelectHandler(() =>
        startTransition(() => {
          setFilters({
            ...filters,
            [category]: !enabled,
          });
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
