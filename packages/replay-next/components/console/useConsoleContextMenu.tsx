import { useContext } from "react";

import { scrollCurrentTimeIndicatorIntoView } from "replay-next/components/console/CurrentTimeIndicator";
import ContextMenuDivider from "replay-next/components/context-menu/ContextMenuDivider";
import ContextMenuItem from "replay-next/components/context-menu/ContextMenuItem";
import useContextMenu from "replay-next/components/context-menu/useContextMenu";
import Icon from "replay-next/components/Icon";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { getLoggableTime, isPointInstance } from "replay-next/src/utils/loggables";
import { Badge, POINT_BEHAVIOR_DISABLED_TEMPORARILY } from "shared/client/types";

import { Loggable } from "./LoggablesContext";
import styles from "./ContextMenu.module.css";

const BADGES: Badge[] = ["green", "yellow", "orange", "purple"];

export default function useConsoleContextMenu(loggable: Loggable) {
  const { rangeForDisplay, update } = useContext(FocusContext);
  const { editPointBadge, editPointBehavior } = useContext(PointsContext);
  const { currentUserInfo, duration } = useContext(SessionContext);

  const setFocusBegin = () => {
    const begin = getLoggableTime(loggable);
    const end = rangeForDisplay !== null ? rangeForDisplay.end.time : duration;

    update([begin, end], true);
  };

  const setFocusEnd = () => {
    const end = getLoggableTime(loggable);
    const begin = rangeForDisplay !== null ? rangeForDisplay.begin.time : 0;

    update([begin, end], true);
  };

  const setBadge = (badge: Badge | null) => {
    if (isPointInstance(loggable)) {
      editPointBadge(loggable.point.key, badge);
    }
  };

  const scrollToPause = scrollCurrentTimeIndicatorIntoView;

  const disableLogging = () => {
    if (isPointInstance(loggable)) {
      editPointBehavior(
        loggable.point.key,
        {
          shouldLog: POINT_BEHAVIOR_DISABLED_TEMPORARILY,
        },
        loggable.point.user?.id === currentUserInfo?.id
      );
    }
  };

  return useContextMenu(
    <>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onClick={setFocusBegin}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusEndButton" onClick={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>

      <ContextMenuDivider />
      <ContextMenuItem dataTestId="ConsoleContextMenu-ScrollToPauseButton" onClick={scrollToPause}>
        <>
          <Icon className={styles.SmallerIcon} type="console" />
          Scroll to pause
        </>
      </ContextMenuItem>

      {isPointInstance(loggable) && (
        <>
          <ContextMenuItem
            dataTestId="ConsoleContextMenu-ToggleLoggingButton"
            onClick={disableLogging}
          >
            <>
              <Icon className={styles.SmallerIcon} type="toggle-off" />
              Disable logging
            </>
          </ContextMenuItem>
          <ContextMenuDivider />
          <ContextMenuItem>
            <div
              className={styles.UnicornBadge}
              data-test-id="ConsoleContextMenu-Badge-unicorn"
              onClick={() => setBadge("unicorn")}
            />
            {BADGES.map(badge => (
              <div
                key={badge}
                className={styles.ColorBadge}
                data-test-id={`ConsoleContextMenu-Badge-${badge}`}
                onClick={() => setBadge(badge)}
                style={{
                  // @ts-ignore
                  "--badge-color": `var(--badge-${badge}-color)`,
                }}
              />
            ))}
            <div className={styles.ColorBadgeClear} onClick={() => setBadge(null)} />
          </ContextMenuItem>
        </>
      )}
    </>,
    {
      dataTestId: "ConsoleContextMenu",
    }
  );
}
