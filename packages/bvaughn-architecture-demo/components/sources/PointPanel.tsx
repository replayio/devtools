import Icon from "@bvaughn/components/Icon";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { validate } from "@bvaughn/src/utils/points";
import { KeyboardEvent, Suspense, useContext, useMemo, useState } from "react";
import { Point } from "shared/client/types";

import Loader from "../Loader";

import styles from "./PointPanel.module.css";
import PointPanelTimeline from "./PointPanelTimeline";

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
            <PointPanelTimeline point={point} />
          </Suspense>
        </div>
      </div>
    );
  }
}
