import Icon from "@bvaughn/components/Icon";
import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { validate } from "@bvaughn/src/utils/points";
import { Suspense, useContext, useMemo, useState } from "react";
import { Point } from "shared/client/types";

import Loader from "../Loader";
import AutoCompleteInput from "./AutoCompleteInput";

import styles from "./PointPanel.module.css";
import PointPanelTimeline from "./PointPanelTimeline";
import SyntaxHighlightedLine from "./SyntaxHighlightedLine";

export default function PointPanel({ className, point }: { className: string; point: Point }) {
  const { editPoint } = useContext(PointsContext);

  const [isEditing, setIsEditing] = useState(false);

  const [editableCondition, setEditableCondition] = useState(point.condition);
  const [editableContent, setEditableContent] = useState(point.content);

  const isContentValid = useMemo(() => validate(editableContent), [editableContent]);
  const isConditionValid = useMemo(
    () => editableCondition === null || validate(editableCondition),
    [editableCondition]
  );
  const hasChanged = editableCondition !== point.condition || editableContent !== point.content;

  if (isEditing) {
    const onCancel = () => {
      setEditableContent(point.content);
      setEditableCondition(point.condition);
      setIsEditing(false);
    };

    const onChange = (newContent: string) => {
      setEditableContent(newContent);
    };

    const onSubmit = () => {
      if (isConditionValid && isContentValid && hasChanged) {
        editPoint(point.id, { condition: editableCondition, content: editableContent });
      }
      setIsEditing(false);
    };

    return (
      <div
        className={`${styles.Point} ${className}`}
        data-test-id={`PointPanel-${point.location.line}`}
      >
        {/* TODO Conditional */}
        <div className={styles.Row}>
          <div
            className={`${styles.ContentWrapper} ${isContentValid || styles.ContentWrapperInvalid}`}
          >
            {/* TODO Badge picker */}
            <div className={styles.BadgePicker} />
            <div className={styles.Content}>
              <AutoCompleteInput
                autoFocus
                className={styles.ContentInput}
                data-test-name="PointPanelContentInput"
                onCancel={onCancel}
                onChange={onChange}
                onSubmit={onSubmit}
                value={editableContent}
              />
            </div>
          </div>
          <button className={styles.SaveButton} onClick={onSubmit}>
            Save
          </button>
        </div>
        {point.condition == null && (
          <div className={styles.Row}>
            <button className={styles.AddConditionalButton}>Add conditional</button>
          </div>
        )}
      </div>
    );
  } else {
    const startEditing = () => {
      setEditableCondition(point.condition);
      setEditableContent(point.content);
      setIsEditing(true);
    };

    return (
      <div
        className={`${styles.Point} ${className}`}
        data-test-id={`PointPanel-${point.location.line}`}
      >
        <div className={styles.Row}>
          <div className={styles.ContentWrapper}>
            {/* TODO Badge picker */}
            <div className={styles.BadgePicker} />
            <div className={styles.Content} onClick={startEditing}>
              <SyntaxHighlightedLine code={point.content} />
            </div>
            <button className={styles.EditButton} onClick={startEditing}>
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
