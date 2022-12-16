import { SourceId } from "@replayio/protocol";

import Icon from "bvaughn-architecture-demo/components/Icon";
import {
  AddPoint,
  DeletePoints,
  EditPoint,
} from "bvaughn-architecture-demo/src/contexts/PointsContext";
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
      data-test-name="ColumnBreakpointMarker"
      data-test-id={`ColumnBreakpointMarker-${sourceId}:${lineNumber}:${columnIndex}`}
    >
      <Icon
        className={point?.shouldBreak ? styles.EnabledIcon : styles.DisabledIcon}
        type="breakpoint"
      />
    </button>
  );
}
