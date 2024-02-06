import { FormEvent, MouseEvent, useContext, useMemo, useTransition } from "react";
import { ContextMenuCategory, ContextMenuItem, useContextMenu } from "use-context-menu";

import { Badge, Checkbox } from "design";
import { RecordedEvent } from "protocol/RecordedEventsCache";
import Icon from "replay-next/components/Icon";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { isExecutionPointsWithinRange } from "replay-next/src/utils/time";
import { ConsoleEventFilterPreferencesKey } from "shared/user-data/GraphQL/config";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";

import styles from "./EventsDropDownMenu.module.css";

export default function EventsDropDownMenu({ events }: { events: RecordedEvent[] }) {
  const { range: focusWindow } = useContext(FocusContext);

  const eventCounts = useMemo<{ [key in ConsoleEventFilterPreferencesKey]: number }>(
    () =>
      events.reduce(
        (counts, event) => {
          if (
            focusWindow &&
            !isExecutionPointsWithinRange(
              event.point,
              focusWindow.begin.point,
              focusWindow.end.point
            )
          ) {
            return counts;
          }

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
    [events, focusWindow]
  );

  const [filters] = useGraphQLUserData("console_eventFilters");

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
  const [filters, setFilters] = useGraphQLUserData("console_eventFilters");
  const [isPending, startTransition] = useTransition();

  const enabled = filters[category] !== false;
  const checked = enabled && count > 0;

  const onChange = () => {
    startTransition(() => {
      setFilters({
        ...filters,
        [category]: !enabled,
      });
    });
  };

  return (
    <ContextMenuItem disabled={count === 0 || isPending}>
      <div
        className={styles.MenuItem}
        onClick={event => {
          // Don't close the drop-down menu on click
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <Checkbox
          checked={checked}
          className={styles.Checkbox}
          label={category}
          onChange={onChange}
        />
        {count > 0 && <Badge label={count} />}
      </div>
    </ContextMenuItem>
  );
}
