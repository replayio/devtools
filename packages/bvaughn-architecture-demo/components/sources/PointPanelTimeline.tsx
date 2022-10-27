import Icon from "@bvaughn/components/Icon";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { imperativelyGetClosestPointForTime } from "@bvaughn/src/suspense/PointsCache";
import { isExecutionPointsGreaterThan, isExecutionPointsLessThan } from "@bvaughn/src/utils/time";
import { TimeStampedPoint } from "@replayio/protocol";
import { CSSProperties, MouseEvent, useContext, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
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
  const client = useContext(ReplayClientContext);
  const { duration } = useContext(SessionContext);
  const {
    executionPoint: currentExecutionPoint,
    isPending,
    time: currentTime,
    update,
  } = useContext(TimelineContext);

  const [hoverTime, setHoverTime] = useState<number>(0);

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

  const onTimelineClick = async (event: MouseEvent) => {
    if (isPending) {
      return;
    }

    const currentTarget = event.currentTarget as HTMLDivElement;
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.x;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const time = Math.round(duration * percentage);
    const point = await imperativelyGetClosestPointForTime(client, time);

    update(hoverTime, point);
  };

  const onTimelineMouseLeave = () => {
    setHoverTime(0);
  };

  const onTimelineMouseMove = (event: MouseEvent) => {
    const currentTarget = event.currentTarget as HTMLDivElement;
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.x;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const time = Math.round(duration * percentage);

    setHoverTime(time);
  };

  return (
    <>
      <button
        className={styles.PreviousHitPointButton}
        data-test-name="PreviousHitPointButton"
        disabled={isPending || !previousButtonEnabled}
        onClick={goToPrevious}
      >
        <Icon className={styles.PreviousHitPointButtonIcon} type="arrow-left" />
      </button>
      {tooManyPointsToFind ? (
        <div
          className={styles.HitPointsLabelTooMany}
          data-test-name="LogPointStatus"
          style={badgeStyle as CSSProperties}
        >
          -
        </div>
      ) : (
        <div
          className={styles.HitPointsLabel}
          data-test-name="LogPointStatus"
          style={badgeStyle as CSSProperties}
        >
          {label}
        </div>
      )}
      <button
        className={styles.NextHitPointButton}
        data-test-name="NextHitPointButton"
        disabled={isPending || !nextButtonEnabled}
        onClick={goToNext}
      >
        <Icon className={styles.NextHitPointButtonIcon} type="arrow-right" />
      </button>
      <div
        className={isPending ? styles.HitPointTimelineDisabled : styles.HitPointTimeline}
        data-test-name="PointPanelTimeline"
        data-test-state={isPending ? "disabled" : "enabled"}
        onClick={onTimelineClick}
        onMouseLeave={onTimelineMouseLeave}
        onMouseMove={onTimelineMouseMove}
      >
        <div className={styles.HitPointTimelineBackground} />
        <div
          className={
            !isPending && hoverTime > 0 && hoverTime < currentTime
              ? styles.ProgressBarPartiallyOpaque
              : styles.ProgressBarOpaque
          }
          style={{
            width: `${(100 * currentTime) / duration}%`,
          }}
        />
        {!isPending && hoverTime > 0 && (
          <div
            className={
              hoverTime < currentTime ? styles.ProgressBarOpaque : styles.ProgressBarPartiallyOpaque
            }
            style={{
              width: `${(100 * hoverTime) / duration}%`,
            }}
          />
        )}
        {hitPoints.map(hitPoint => (
          <button
            className={
              currentHitPoint === hitPoint ? styles.HitPointButtonCurrent : styles.HitPointButton
            }
            disabled={isPending}
            key={hitPoint.point}
            onClick={(event: MouseEvent) => {
              event.stopPropagation();
              event.preventDefault();

              update(hitPoint.time, hitPoint.point);
            }}
            style={{
              left: `${(100 * hitPoint.time) / duration}%`,
            }}
          />
        ))}
      </div>
    </>
  );
}
