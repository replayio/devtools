import Icon from "@bvaughn/components/Icon";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import { validate } from "@bvaughn/src/utils/points";
import { KeyboardEvent, Suspense, useContext, useMemo, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";

import Loader from "../Loader";

import styles from "./PointPanel.module.css";

export default function PointPanel({ className, point }: { className: string; point: Point }) {
  const { editPoint } = useContext(PointsContext);

  const [editableCondition, setEditableCondition] = useState(point.condition);
  const [editableContent, setEditableContent] = useState(point.content);

  const isContentValid = useMemo(() => validate(editableContent), [editableContent]);
  const isConditionValid = useMemo(
    () => editableCondition === null || validate(editableCondition),
    [editableCondition]
  );
  const hasChanged = editableCondition !== point.condition || editableContent !== point.content;

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

  return (
    <div
      className={`${styles.Point} ${className}`}
      data-test-id={`PointPanel-${point.location.line}`}
    >
      <div className={styles.Row}>
        <input
          className={styles.Input}
          data-test-id={`PointPanelInput-${point.location.line}-content`}
          disabled={!point.shouldLog}
          onChange={event => setEditableContent(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder="Content..."
          value={editableContent}
        />
        <label className={styles.Label}>
          <input
            checked={point.shouldBreak}
            onChange={event => editPoint(point.id, { shouldBreak: event.currentTarget.checked })}
            type="checkbox"
          />
          break?
        </label>
        <label className={styles.Label}>
          <input
            checked={point.shouldLog}
            onChange={event => editPoint(point.id, { shouldLog: event.currentTarget.checked })}
            type="checkbox"
          />
          log?
        </label>
        <small>
          ({point.location.line}:{point.location.column})
        </small>
        <button
          className={styles.SaveButton}
          disabled={!isConditionValid || !isContentValid || !hasChanged}
          onClick={() =>
            editPoint(point.id, { condition: editableCondition, content: editableContent })
          }
        >
          <Icon className={styles.SaveButtonIcon} type="save" />
        </button>
      </div>
      <div className={styles.Row}>
        <input
          className={styles.Input}
          data-test-id={`PointPanelInput-${point.location.line}-condition`}
          onChange={event => setEditableCondition(event.currentTarget.value || null)}
          onKeyDown={onKeyDown}
          placeholder="Condition..."
          value={editableCondition || ""}
        />
      </div>
      <div className={styles.Row}>
        <Suspense fallback={<Loader />}>
          <HitPoints point={point} />
        </Suspense>
      </div>
    </div>
  );
}

function HitPoints({ point }: { point: Point }) {
  const client = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);

  const [hitPoints, status] = getHitPointsForLocation(client, point.location, null, focusRange);

  switch (status) {
    case "too-many-points-to-find":
    case "too-many-points-to-run-analysis": {
      return (
        <div className={styles.HitPointsWarning}>
          <Icon className={styles.HitPointsWarningIcon} type="warning" /> Use Focus Mode to reduce
          the number of hits.
        </div>
      );
    }
    default: {
      if (hitPoints.length === 0) {
        return (
          <ul className={styles.HitPointsList}>
            <li className={styles.HitPointListItem}>No hits</li>
          </ul>
        );
      } else {
        return (
          <ul className={styles.HitPointsList}>
            <li className={styles.HitPointListItem}>Hits:</li>
            {hitPoints.map(hitPoint => (
              <li key={hitPoint.point} className={styles.HitPointListItem}>
                •
              </li>
            ))}
          </ul>
        );
      }
    }
  }
}
