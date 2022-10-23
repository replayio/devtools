import Icon from "@bvaughn/components/Icon";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { isExecutionPointsGreaterThan, isExecutionPointsLessThan } from "@bvaughn/src/utils/time";
import { TimeStampedPoint } from "@replayio/protocol";
import { CSSProperties, useContext } from "react";
import { HitPointStatus, Point } from "shared/client/types";

import styles from "./PointPanelTimeline.module.css";
import { getBadgeStyleVars } from "./utils/getBadgeStyleVars";
import { findHitPoint, findHitPointAfter, findHitPointBefore } from "./utils/points";

export default function PointPanelTimeline({
  hitPoints,
  hitPointStatus,
  point,
}: {
  hitPoints: TimeStampedPoint[];
  hitPointStatus: HitPointStatus;
  point: Point;
}) {
  const { duration } = useContext(SessionContext);
  const {
    executionPoint: currentExecutionPoint,
    isPending,
    time: currentTime,
    update,
  } = useContext(TimelineContext);

  const [currentHitPoint, currentHitPointIndex] = findHitPoint(hitPoints, currentExecutionPoint);

  const firstHitPoint = hitPoints.length > 0 ? hitPoints[0] : null;
  const lastHitPoint = hitPoints.length > 0 ? hitPoints[hitPoints.length - 1] : null;
  const previousButtonEnabled =
    firstHitPoint != null && isExecutionPointsLessThan(firstHitPoint.point, currentExecutionPoint);
  const nextButtonEnabled =
    lastHitPoint != null && isExecutionPointsGreaterThan(lastHitPoint.point, currentExecutionPoint);

  const goToPrevious = () => {
    const [prevHitPoint] = findHitPointBefore(hitPoints, currentExecutionPoint);
    if (prevHitPoint !== null) {
      update(prevHitPoint.time, prevHitPoint.point);
    }
  };
  const goToNext = () => {
    const [nextHitPoint] = findHitPointAfter(hitPoints, currentExecutionPoint);
    if (nextHitPoint !== null) {
      update(nextHitPoint.time, nextHitPoint.point);
    }
  };

  const label =
    currentHitPointIndex !== null
      ? `${currentHitPointIndex + 1} / ${hitPoints.length}`
      : hitPoints.length;

  const tooManyPointsToFind = hitPointStatus === "too-many-points-to-find";

  const badgeStyle = getBadgeStyleVars(point.badge);

  return (
    <>
      <button
        className={styles.PreviousHitPointButton}
        disabled={isPending || !previousButtonEnabled}
        onClick={goToPrevious}
      >
        <Icon className={styles.PreviousHitPointButtonIcon} type="arrow-left" />
      </button>
      {tooManyPointsToFind ? (
        <div className={styles.HitPointsLabelTooMany} style={badgeStyle as CSSProperties}>
          -
        </div>
      ) : (
        <div className={styles.HitPointsLabel} style={badgeStyle as CSSProperties}>
          {label}
        </div>
      )}
      <button
        className={styles.NextHitPointButton}
        disabled={isPending || !nextButtonEnabled}
        onClick={goToNext}
      >
        <Icon className={styles.NextHitPointButtonIcon} type="arrow-right" />
      </button>
      <div className={isPending ? styles.HitPointTimelineDisabled : styles.HitPointTimeline}>
        <div
          className={styles.CurrentTimeProgressBar}
          style={{
            width: `${(100 * currentTime) / duration}%`,
          }}
        />
        {hitPoints.map(hitPoint => (
          <button
            className={
              currentHitPoint === hitPoint ? styles.HitPointButtonCurrent : styles.HitPointButton
            }
            disabled={isPending}
            key={hitPoint.point}
            onClick={() => update(hitPoint.time, hitPoint.point)}
            style={{
              left: `${(100 * hitPoint.time) / duration}%`,
            }}
          />
        ))}
      </div>
    </>
  );
}
