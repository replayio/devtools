import Icon from "@bvaughn/components/Icon";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { Point, PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import { validate } from "@bvaughn/src/utils/points";
import { MAX_POINTS_FOR_FULL_ANALYSIS } from "protocol/thread/analysis";
import { KeyboardEvent, Suspense, useContext, useMemo, useState } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import Loader from "../Loader";

import styles from "./PointPanel.module.css";

export default function PointPanel({ className, point }: { className: string; point: Point }) {
  const { editPoint } = useContext(PointsContext);

  const [editableContent, setEditableContent] = useState(point.content);

  const isContentValid = useMemo(() => validate(editableContent), [editableContent]);
  const hasContentChanged = editableContent !== point.content;

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        if (isContentValid && hasContentChanged) {
          editPoint(point.id, { content: editableContent });
        }
        break;
      case "Escape":
        setEditableContent(point.content);
        break;
    }
  };

  return (
    <div
      className={`${styles.Point} ${className}`}
      data-test-id={`PointPanel-${point.location.line}`}
    >
      <div className={styles.Row}>
        <Suspense fallback={<Loader />}>
          <HitPointsWarning point={point} />
        </Suspense>
      </div>
      <div className={styles.Row}>
        <input
          className={styles.Input}
          disabled={!point.enableLogging}
          onChange={event => setEditableContent(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder="Content..."
          value={editableContent}
        />
        <label className={styles.Label}>
          <input
            checked={point.enableBreaking}
            onChange={event => editPoint(point.id, { enableBreaking: event.currentTarget.checked })}
            type="checkbox"
          />
          break?
        </label>
        <label className={styles.Label}>
          <input
            checked={point.enableLogging}
            onChange={event => editPoint(point.id, { enableLogging: event.currentTarget.checked })}
            type="checkbox"
          />
          log?
        </label>
        <small>
          ({point.location.line}:{point.location.column})
        </small>
        <button
          className={styles.SaveButton}
          disabled={!isContentValid || !hasContentChanged}
          onClick={() => editPoint(point.id, { content: editableContent })}
        >
          <Icon className={styles.SaveButtonIcon} type="save" />
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

function HitPointsWarning({ point }: { point: Point }) {
  const client = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);

  const hitPoints = getHitPointsForLocation(client, point.location, focusRange);

  if (hitPoints.length >= MAX_POINTS_FOR_FULL_ANALYSIS) {
    return (
      <div className={styles.HitPointsWarning}>
        <Icon className={styles.HitPointsWarningIcon} type="warning" /> Use Focus Mode to reduce the
        number of hits.
      </div>
    );
  } else {
    return null;
  }
}

function HitPoints({ point }: { point: Point }) {
  const client = useContext(ReplayClientContext);
  const { range: focusRange } = useContext(FocusContext);

  const hitPoints = getHitPointsForLocation(client, point.location, focusRange);

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
