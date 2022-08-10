import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { Badge, PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import useModalDismissSignal from "@bvaughn/src/hooks/useModalDismissSignal";
import { getLoggableTime, isPointInstance } from "@bvaughn/src/utils/loggables";
import { useContext, useRef } from "react";

import { ConsoleContextMenuContext, Coordinates } from "./ConsoleContextMenuContext";
import styles from "./ContextMenu.module.css";
import { Loggable } from "./LoggablesContext";

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
      <div className={styles.ContextMenuItem} onClick={setFocusBegin}>
        Set focus start
      </div>
      <div className={styles.ContextMenuItem} onClick={setFocusEnd}>
        Set focus end
      </div>
      {isPointInstance(loggable) && (
        <div className={styles.ContextMenuItem}>
          <div className={styles.UnicornBadge} onClick={() => setBadge("unicorn")} />
          {BADGES.map(badge => (
            <div
              key={badge}
              className={styles.ColorBadge}
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
