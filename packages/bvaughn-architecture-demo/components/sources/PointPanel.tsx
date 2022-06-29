import Icon from "@bvaughn/components/Icon";
import { Point, PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { useContext, useState } from "react";

import styles from "./PointPanel.module.css";

export default function PointPanel({ point }: { point: Point }) {
  const { deletePoint, editPoint } = useContext(PointsContext);

  const [editableContent, setEditableContent] = useState(point.content);

  return (
    <div className={styles.Point}>
      <button className={styles.DeleteButton} onClick={() => deletePoint(point.id)}>
        <Icon className={styles.DeleteButtonIcon} type="delete" />
      </button>
      <input
        className={styles.Input}
        onChange={event => setEditableContent(event.currentTarget.value)}
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
        ({point.lineNumber}:{point.columnNumber})
      </small>
      <button
        className={styles.SaveButton}
        onClick={() => editPoint(point.id, { content: editableContent })}
      >
        <Icon className={styles.SaveButtonIcon} type="save" />
      </button>
    </div>
  );
}
