import Icon from "@bvaughn/components/Icon";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { SessionContext } from "@bvaughn/src/contexts/SessionContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import { validate } from "@bvaughn/src/utils/points";
import { isExecutionPointsGreaterThan, isExecutionPointsLessThan } from "@bvaughn/src/utils/time";
import { KeyboardEvent, Suspense, useContext, useMemo, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import Loader from "../Loader";

import styles from "./PointPanel.module.css";
import { findHitPoint, findHitPointAfter, findHitPointBefore } from "./utils/points";

export default function PointPanel({ className, point }: { className: string; point: Point }) {
  const { editPoint } = useContext(PointsContext);

  // TODO Editing
  const [isEditing, setIsEditing] = useState(false);

  const [editableCondition, setEditableCondition] = useState(point.condition);
  const [editableContent, setEditableContent] = useState(point.content);

  const isContentValid = useMemo(() => validate(editableContent), [editableContent]);
  const isConditionValid = useMemo(
    () => editableCondition === null || validate(editableCondition),
    [editableCondition]
  );
  const hasChanged = editableCondition !== point.condition || editableContent !== point.content;

  // TODO Editing
  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        if (isConditionValid && isContentValid && hasChanged) {
          editPoint(point.id, { condition: editableCondition, content: editableContent });
        }
        break;
      case "Escape":
        setEditableContent(point.content);
        setEditableCondition(point.condition);
        break;
    }
  };

  if (isEditing) {
    // TODO
    return null;
  } else {
    return (
      <div
        className={`${styles.Point} ${className}`}
        data-test-id={`PointPanel-${point.location.line}`}
      >
        <div className={styles.Row}>
          <div className={styles.ContentWrapper}>
            {/* TODO Badge picker */}
            <div className={styles.BadgePicker} />
            <div className={styles.ContentLabel}>{point.content}</div>
            <button className={styles.EditButton}>
              <Icon className={styles.EditButtonIcon} type="edit" />
            </button>
          </div>
          <button className={styles.CommentButton}>
            <Icon className={styles.CommentButtonIcon} type="comment" />
          </button>
        </div>
        <div className={styles.Row}>
          <Suspense fallback={<Loader />}>
            <HitPoints point={point} />
          </Suspense>
        </div>
      </div>
    );
  }
}

// TODO Hit point timeline
function HitPoints({ point }: { point: Point }) {
  const client = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);
  const { duration } = useContext(SessionContext);
  const {
    executionPoint: currentExecutionPoint,
    isPending,
    time: currentTime,
    update,
  } = useContext(TimelineContext);

  const [hitPoints] = getHitPointsForLocation(client, point.location, null, focusRange);

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

  return (
    <>
      <button
        className={styles.PreviousHitPointButton}
        disabled={isPending || !previousButtonEnabled}
        onClick={goToPrevious}
      >
        <Icon className={styles.PreviousHitPointButtonIcon} type="arrow-left" />
      </button>
      <div className={styles.HitPointsLabel}>{label}</div>
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
