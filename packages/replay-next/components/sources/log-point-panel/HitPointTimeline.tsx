import { TimeStampedPoint } from "@replayio/protocol";
import {
  MouseEvent,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import Icon from "replay-next/components/Icon";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { imperativelyGetClosestPointForTime } from "replay-next/src/suspense/ExecutionPointsCache";
import { formatTimestamp } from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { HitPointStatus, Point } from "shared/client/types";

import { findHitPointAfter, findHitPointBefore, noMatchTuple } from "../utils/points";
import { findHitPoint } from "../utils/points";
import { compareTimeStampedPoints } from "protocol/utils";
import Capsule from "./Capsule";
import styles from "./HitPointTimeline.module.css";

export default function HitPointTimeline({
  hasConditional,
  hitPoints,
  hitPointStatus,
  point,
  shouldLog,
  toggleConditional,
  toggleShouldLog,
}: {
  hasConditional: boolean;
  hitPoints: TimeStampedPoint[];
  hitPointStatus: HitPointStatus | null;
  shouldLog: boolean;
  point: Point;
  toggleConditional: () => void;
  toggleShouldLog: () => void;
}) {
  const client = useContext(ReplayClientContext);
  const { currentUserInfo, duration } = useContext(SessionContext);
  const {
    executionPoint: currentExecutionPoint,
    isPending,
    time: currentTime,
    update,
  } = useContext(TimelineContext);

  const currentTS: TimeStampedPoint = { point: currentExecutionPoint!, time: currentTime };

  const pointEditable = point.user?.id === currentUserInfo?.id;

  const [hoverCoordinates, setHoverCoordinates] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const [hoverTime, setHoverTime] = useState<number>(0);

  // When the user seeks to a new time, we should immediately update to reflect their intent.
  const [optimisticTime, setOptimisticTime] = useState<number | null>(null);
  const progressBarTime = isPending && optimisticTime !== null ? optimisticTime : currentTime;

  useEffect(() => {
    // Reset this whenever the actual time changes;
    // It's only meant to be something shown temporarily.
    setOptimisticTime(null);
  }, [currentTime]);

  const [closestHitPoint, closestHitPointIndex] = useMemo(
    () =>
      currentExecutionPoint ? findHitPoint(hitPoints, currentTS, false) : noMatchTuple,
    [currentExecutionPoint, hitPoints]
  );

  const currentHitPoint = closestHitPoint?.point === currentExecutionPoint ? closestHitPoint : null;

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

    setOptimisticTime(hoverTime);
    update(hoverTime, point, false);
  };

  const onTimelineMouseLeave = () => {
    setHoverTime(0);
    setHoverCoordinates(null);
  };

  const onTimelineMouseMove = (event: MouseEvent) => {
    const currentTarget = event.currentTarget as HTMLDivElement;
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.x;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const time = Math.round(duration * percentage);

    setHoverTime(time);
    setHoverCoordinates({ clientX: event.clientX, clientY: event.clientY });
  };

  const firstHitPoint = hitPoints.length > 0 ? hitPoints[0] : null;
  const lastHitPoint = hitPoints.length > 0 ? hitPoints[hitPoints.length - 1] : null;
  const previousButtonEnabled =
    currentExecutionPoint &&
    firstHitPoint != null &&
    compareTimeStampedPoints(firstHitPoint, currentTS) < 0;
  const nextButtonEnabled =
    currentExecutionPoint &&
    lastHitPoint != null &&
    compareTimeStampedPoints(lastHitPoint, currentTS) > 0;

  const goToIndex = (index: number) => {
    const hitPoint = hitPoints[index];
    if (hitPoint !== null) {
      setOptimisticTime(hitPoint.time);
      update(hitPoint.time, hitPoint.point, false, point.location);
    }
  };

  const goToPrevious = () => {
    if (!currentExecutionPoint) {
      return;
    }
    const [prevHitPoint] = findHitPointBefore(hitPoints, currentTS);
    if (prevHitPoint !== null) {
      setOptimisticTime(prevHitPoint.time);
      update(prevHitPoint.time, prevHitPoint.point, false, point.location);
    }
  };
  const goToNext = () => {
    if (!currentExecutionPoint) {
      return;
    }
    const [nextHitPoint] = findHitPointAfter(hitPoints, currentTS);
    if (nextHitPoint !== null) {
      setOptimisticTime(nextHitPoint.time);
      update(nextHitPoint.time, nextHitPoint.point, false, point.location);
    }
  };

  const disableButtons = isPending && optimisticTime === null;

  return (
    <div className={styles.PointPanelTimeline}>
      <button
        className={styles.PreviousButton}
        data-test-name="PreviousHitPointButton"
        disabled={disableButtons || !previousButtonEnabled}
        onClick={goToPrevious}
      >
        <Icon className={styles.PreviousButtonIcon} type="arrow-left" />
      </button>
      <Capsule
        closestHitPointIndex={closestHitPointIndex}
        currentHitPoint={currentHitPoint}
        editable={pointEditable}
        goToIndex={goToIndex}
        hasConditional={hasConditional}
        hitPoints={hitPoints}
        hitPointStatus={hitPointStatus}
        point={point}
        shouldLog={shouldLog}
        toggleConditional={toggleConditional}
        toggleShouldLog={toggleShouldLog}
      />
      <button
        className={styles.NextButton}
        data-test-name="NextHitPointButton"
        disabled={disableButtons || !nextButtonEnabled}
        onClick={goToNext}
      >
        <Icon className={styles.NextButtonIcon} type="arrow-right" />
      </button>
      <span /> {/* Spacer */}
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
            !isPending && hoverTime > 0 && hoverTime < progressBarTime
              ? styles.ProgressBarPartiallyOpaque
              : styles.ProgressBarOpaque
          }
          style={{
            width: `${(100 * progressBarTime) / duration}%`,
          }}
        />
        {!isPending && hoverTime > 0 && (
          <div
            className={
              hoverTime < progressBarTime
                ? styles.ProgressBarOpaque
                : styles.ProgressBarPartiallyOpaque
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

              setOptimisticTime(hitPoint.time);
              update(hitPoint.time, hitPoint.point, false, point.location);
            }}
            style={{
              left: `${(100 * hitPoint.time) / duration}%`,
            }}
          />
        ))}
        {hoverTime !== null && hoverCoordinates !== null && (
          <TimeTooltip
            clientX={hoverCoordinates.clientX}
            clientY={hoverCoordinates.clientY}
            time={hoverTime}
          />
        )}
      </div>
    </div>
  );
}

function TimeTooltip({
  clientX,
  clientY,
  time,
}: {
  clientX: number;
  clientY: number;
  time: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const tooltip = ref.current!;
    const rect = tooltip.getBoundingClientRect();

    tooltip.style.left = `${clientX - rect.width / 2}px`;
    tooltip.style.top = `${clientY - rect.height}px`;
  });

  return createPortal(
    <div className={styles.TimeTool} ref={ref}>
      {formatTimestamp(time)}
    </div>,
    document.body
  );
}
