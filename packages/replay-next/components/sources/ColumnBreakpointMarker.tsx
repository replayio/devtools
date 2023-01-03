import { SourceId } from "@replayio/protocol";

import Icon from "replay-next/components/Icon";
import { AddPoint, DeletePoints, EditPoint } from "replay-next/src/contexts/PointsContext";
import { Point } from "shared/client/types";

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
          shouldBreak: true,
        },
        {
          column: columnIndex,
          line: lineNumber,
          sourceId,
        }
      );
    } else {
      if (point.shouldLog) {
        editPoint(point.id, { shouldBreak: !point.shouldBreak });
      } else {
        deletePoints(point.id);
      }
    }
  };

  return (
    <button
      className={styles.Button}
      onClick={onClick}
      data-test-id={`ColumnBreakpointMarker-${sourceId}:${lineNumber}:${columnIndex}`}
      data-test-name="ColumnBreakpointMarker"
      data-test-state={point?.shouldBreak ? "enabled" : "disabled"}
    >
      <Icon
        className={point?.shouldBreak ? styles.EnabledIcon : styles.DisabledIcon}
        type="breakpoint"
      />
    </button>
  );
}
