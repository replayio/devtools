import { SourceId } from "@replayio/protocol";

import Icon from "replay-next/components/Icon";
import { AddPoint, DeletePoints, EditPoint } from "replay-next/src/contexts/PointsContext";
import { POINT_BEHAVIOR_DISABLED, POINT_BEHAVIOR_ENABLED, Point } from "shared/client/types";

import styles from "./ColumnBreakpointMarker.module.css";

export default function ColumnBreakpointMarker({
  addPoint,
  columnIndex,
  deletePoints,
  editPoint,
  lineNumber,
  point,
  sourceId,
}: {
  addPoint: AddPoint;
  columnIndex: number;
  deletePoints: DeletePoints;
  editPoint: EditPoint;
  lineNumber: number;
  point: Point | null;
  sourceId: SourceId;
}) {
  const onClick = () => {
    if (point === null) {
      addPoint(
        {
          shouldBreak: POINT_BEHAVIOR_ENABLED,
        },
        {
          column: columnIndex,
          line: lineNumber,
          sourceId,
        }
      );
    } else {
      if (point.shouldLog === POINT_BEHAVIOR_ENABLED) {
        editPoint(point.id, {
          shouldBreak:
            point.shouldBreak === POINT_BEHAVIOR_ENABLED
              ? POINT_BEHAVIOR_DISABLED
              : POINT_BEHAVIOR_ENABLED,
        });
      } else {
        deletePoints(point.id);
      }
    }
  };

  const shouldBreak = point?.shouldBreak === POINT_BEHAVIOR_ENABLED;

  return (
    <button
      className={styles.Button}
      onClick={onClick}
      data-test-id={`ColumnBreakpointMarker-${sourceId}:${lineNumber}:${columnIndex}`}
      data-test-name="ColumnBreakpointMarker"
      data-test-state={shouldBreak ? "enabled" : "disabled"}
    >
      <Icon className={shouldBreak ? styles.EnabledIcon : styles.DisabledIcon} type="breakpoint" />
    </button>
  );
}
