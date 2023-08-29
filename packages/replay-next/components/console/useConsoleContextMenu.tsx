import { useContext } from "react";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "use-context-menu";

import { scrollCurrentTimeIndicatorIntoView } from "replay-next/components/console/CurrentTimeIndicator";
import Icon from "replay-next/components/Icon";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import {
  getLoggableExecutionPoint,
  getLoggableTime,
  isPointInstance,
} from "replay-next/src/utils/loggables";
import { Badge, POINT_BEHAVIOR_DISABLED_TEMPORARILY } from "shared/client/types";

import { Loggable } from "./LoggablesContext";
import styles from "./ContextMenu.module.css";

const BADGES: Badge[] = ["green", "yellow", "orange", "purple"];

export default function useConsoleContextMenu(loggable: Loggable) {
  const { range, update } = useContext(FocusContext);
  const { editPointBadge, editPointBehavior } = useContext(PointsContext);
  const { currentUserInfo, duration, endpoint } = useContext(SessionContext);

  const setFocusBegin = () => {
    update(
      {
        begin: {
          point: getLoggableExecutionPoint(loggable),
          time: getLoggableTime(loggable),
        },
        end: range?.end ?? {
          point: endpoint,
          time: duration,
        },
      },
      {
        bias: "begin",
        sync: true,
      }
    );
  };

  const setFocusEnd = () => {
    update(
      {
        begin: range?.begin ?? {
          point: "0",
          time: 0,
        },
        end: {
          point: getLoggableExecutionPoint(loggable),
          time: getLoggableTime(loggable),
        },
      },
      {
        bias: "end",
        sync: true,
      }
    );
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
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusStartButton" onSelect={setFocusBegin}>
        <>
          <Icon type="set-focus-start" />
          Set focus start
        </>
      </ContextMenuItem>
      <ContextMenuItem dataTestId="ConsoleContextMenu-SetFocusEndButton" onSelect={setFocusEnd}>
        <>
          <Icon type="set-focus-end" />
          Set focus end
        </>
      </ContextMenuItem>

      {isPointInstance(loggable) && (
        <>
          <ContextMenuDivider />
          <ContextMenuItem
            dataTestId="ConsoleContextMenu-ToggleLoggingButton"
            onSelect={disableLogging}
          >
            <>
              <Icon className={styles.SmallerIcon} type="toggle-off" />
              Disable logging
            </>
          </ContextMenuItem>
          <ContextMenuItem>
            <div
              className={styles.UnicornBadge}
              data-test-id="ConsoleContextMenu-Badge-unicorn"
              onSelect={() => setBadge("unicorn")}
            />
            {BADGES.map(badge => (
              <div
                key={badge}
                className={styles.ColorBadge}
                data-test-id={`ConsoleContextMenu-Badge-${badge}`}
                onSelect={() => setBadge(badge)}
                style={{
                  // @ts-ignore
                  "--badge-color": `var(--badge-${badge}-color)`,
                }}
              />
            ))}
            <div className={styles.ColorBadgeClear} onSelect={() => setBadge(null)} />
          </ContextMenuItem>
        </>
      )}

      <ContextMenuDivider />
      <ContextMenuItem dataTestId="ConsoleContextMenu-ScrollToPauseButton" onSelect={scrollToPause}>
        <>
          <Icon className={styles.SmallerIcon} type="console" />
          Scroll to pause
        </>
      </ContextMenuItem>
    </>,
    {
      dataTestId: "ConsoleContextMenu",
    }
  );
}
