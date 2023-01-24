import { TimeStampedPoint } from "@replayio/protocol";
import { CSSProperties, ReactNode, useMemo } from "react";

import { HitPointStatus, Point } from "shared/client/types";

import { getBadgeStyleVars } from "../utils/getBadgeStyleVars";
import useLogPointPanelContextMenu from "./useLogPointPanelContextMenu";
import styles from "./Capsule.module.css";

export default function Capsule({
  closestHitPointIndex,
  currentHitPoint,
  hasConditional,
  hitPoints,
  hitPointStatus,
  point,
  toggleConditional,
}: {
  closestHitPointIndex: number;
  currentHitPoint: TimeStampedPoint | null;
  hasConditional: boolean;
  hitPoints: TimeStampedPoint[];
  hitPointStatus: HitPointStatus;
  point: Point;
  toggleConditional: () => void;
}) {
  const { contextMenu, onContextMenu } = useLogPointPanelContextMenu({
    currentHitPoint,
    hasConditional,
    lineNumber: point.location.line,
    toggleConditional,
  });

  let tooManyPointsToFind = false;
  switch (hitPointStatus) {
    case "too-many-points-to-find":
    case "unknown-error":
      tooManyPointsToFind = true;
      break;
  }

  // This capsule contains various text depending on the state:
  // * Too many points to fetch? -> "–"
  // * 10 points, first one selected? -> "1/10"
  // * 10 points but none currently selected? -> "10"
  //
  // To prevent re-layout when stepping between the latter two states,
  // pre-calculate the max width of the capsule (e.g. "10/10").
  const minLabelWidthCh = useMemo(() => {
    if (tooManyPointsToFind) {
      return 1;
    } else {
      return `${hitPoints.length}/${hitPoints.length}`.length;
    }
  }, [hitPoints.length, tooManyPointsToFind]);

  const badgeStyle = getBadgeStyleVars(point.badge);

  let label: ReactNode = "10k+";
  if (!tooManyPointsToFind) {
    if (currentHitPoint != null) {
      label = `${closestHitPointIndex + 1}/${hitPoints.length}`;
    } else {
      label = (
        <>
          <span className={styles.NearestIndex}>{closestHitPointIndex + 1}/</span>
          {hitPoints.length}
        </>
      );
    }
  }

  return (
    <>
      <div
        className={styles.Capsule}
        data-test-name="LogPointCapsule"
        onClick={onContextMenu}
        style={badgeStyle as CSSProperties}
      >
        <div
          className={styles.Label}
          data-test-name="LogPointStatus"
          style={{
            minWidth: `${minLabelWidthCh}ch`,
          }}
        >
          {label}
        </div>

        {/* Use a none-standard SVG component/size to simplify layout/margin/gap styles */}
        <svg className={styles.CaretIcon} viewBox="0 0 7 5" fill="none">
          <line x1="1.1749" y1="1.14187" x2="4.1749" y2="4.14187" stroke="currentColor" />
          <line
            y1="-0.5"
            x2="4.24264"
            y2="-0.5"
            transform="matrix(-0.707107 0.707107 0.707107 0.707107 6.82135 1.49542)"
            stroke="currentColor"
          />
        </svg>
      </div>
      {contextMenu}
    </>
  );
}
