import { useContext, useRef } from "react";

import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SessionContext } from "bvaughn-architecture-demo/src/contexts/SessionContext";
import useModalDismissSignal from "bvaughn-architecture-demo/src/hooks/useModalDismissSignal";
import { getLoggableTime, isPointInstance } from "bvaughn-architecture-demo/src/utils/loggables";
import { Badge } from "shared/client/types";

import { ConsoleContextMenuContext, Coordinates } from "./ConsoleContextMenuContext";
import { Loggable } from "./LoggablesContext";
import styles from "./ContextMenu.module.css";

const BADGES: Badge[] = ["green", "yellow", "orange", "purple"];

function ContextMenu({
  hide,
  loggable,
  mouseCoordinates,
}: {
  hide: () => void;
  loggable: Loggable;
  mouseCoordinates: Coordinates;
}) {
  const { duration } = useContext(SessionContext);
  const { rangeForDisplay, update } = useContext(FocusContext);
  const { editPoint } = useContext(PointsContext);

  const ref = useRef<HTMLDivElement>(null);

  useModalDismissSignal(ref, hide, true);

  const setFocusBegin = () => {
    hide();

    const begin = getLoggableTime(loggable);
    const end = rangeForDisplay !== null ? rangeForDisplay.end.time : duration;

    update([begin, end], true);
  };

  const setFocusEnd = () => {
    hide();

    const end = getLoggableTime(loggable);
    const begin = rangeForDisplay !== null ? rangeForDisplay.begin.time : 0;

    update([begin, end], true);
  };

  const setBadge = (badge: Badge | null) => {
    hide();

    if (isPointInstance(loggable)) {
      editPoint(loggable.point.id, { badge });
    }
  };

  return (
    <div
      className={styles.ContextMenu}
      data-test-id="ConsoleContextMenu"
      ref={ref}
      style={{
        left: mouseCoordinates.x,
        top: mouseCoordinates.y,
      }}
    >
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={setFocusBegin}
      >
        Set focus start
      </div>
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusEndButton"
        onClick={setFocusEnd}
      >
        Set focus end
      </div>
      {isPointInstance(loggable) && (
        <div className={styles.ContextMenuItem}>
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
        </div>
      )}
    </div>
  );
}

export default function ContextMenuWrapper() {
  const { hide, loggable, mouseCoordinates } = useContext(ConsoleContextMenuContext);

  if (loggable === null || mouseCoordinates === null) {
    return null;
  } else {
    return <ContextMenu hide={hide} loggable={loggable} mouseCoordinates={mouseCoordinates} />;
  }
}
