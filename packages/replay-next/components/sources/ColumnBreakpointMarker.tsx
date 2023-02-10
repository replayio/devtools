import { SourceId } from "@replayio/protocol";

import Icon from "replay-next/components/Icon";
import { AddPoint, DeletePoints, EditPointBehavior } from "replay-next/src/contexts/points/types";
import {
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_ENABLED,
  Point,
  PointBehavior,
} from "shared/client/types";

import styles from "./ColumnBreakpointMarker.module.css";

export default function ColumnBreakpointMarker({
  addPoint,
  columnIndex,
  deletePoints,
  editPointBehavior,
  lineNumber,
  point,
  pointBehavior,
  sourceId,
}: {
  addPoint: AddPoint;
  columnIndex: number;
  deletePoints: DeletePoints;
  editPointBehavior: EditPointBehavior;
  lineNumber: number;
  point: Point | null;
  pointBehavior: PointBehavior | null;
  sourceId: SourceId;
}) {
  const onClick = () => {
    if (point === null) {
      addPoint(
        {},
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
      if (pointBehavior?.shouldLog === POINT_BEHAVIOR_ENABLED) {
        editPointBehavior(point.key, {
          shouldBreak:
            pointBehavior?.shouldBreak === POINT_BEHAVIOR_ENABLED
              ? POINT_BEHAVIOR_DISABLED
              : POINT_BEHAVIOR_ENABLED,
        });
      } else {
        deletePoints(point.key);
      }
    }
  };

  const shouldBreak = pointBehavior?.shouldBreak === POINT_BEHAVIOR_ENABLED;

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
