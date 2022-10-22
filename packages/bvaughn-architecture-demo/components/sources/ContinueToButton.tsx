import Icon from "@bvaughn/components/Icon";
import { FocusContext } from "@bvaughn/src/contexts/FocusContext";
import { TimelineContext } from "@bvaughn/src/contexts/TimelineContext";
import { getHitPointsForLocation } from "@bvaughn/src/suspense/PointsCache";
import {
  compareExecutionPoints,
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "@bvaughn/src/utils/time";
import { ExecutionPoint, SourceId, TimeStampedPoint } from "@replayio/protocol";
import findLast from "lodash/findLast";
import { useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { LineHitCounts } from "shared/client/types";
import { TOO_MANY_POINTS_TO_FIND } from "shared/constants";

export default function ContinueToButton({
  buttonClassName,
  iconClassName,
  lineHitCounts,
  lineNumber,
  sourceId,
  direction,
}: {
  buttonClassName: string;
  iconClassName: string;
  lineHitCounts: LineHitCounts;
  lineNumber: number;
  sourceId: SourceId;
  direction: "next" | "previous";
}) {
  const { range: focusRange } = useContext(FocusContext);
  const client = useContext(ReplayClientContext);
  const { executionPoint, update } = useContext(TimelineContext);

  const location = useMemo(
    () => ({
      column: lineHitCounts.firstBreakableColumnIndex,
      line: lineNumber,
      sourceId,
    }),
    [lineHitCounts, lineNumber, sourceId]
  );

  const [hitPoints, hitPointStatus] =
    lineHitCounts.count >= TOO_MANY_POINTS_TO_FIND
      ? [null, null]
      : getHitPointsForLocation(client, location, null, focusRange);

  let targetPoint: TimeStampedPoint | null = null;
  if (hitPoints !== null && hitPointStatus !== "too-many-points-to-find") {
    if (direction === "next") {
      targetPoint = findHitPoint(hitPoints, executionPoint);
    } else {
      targetPoint = findLastHitPoint(hitPoints, executionPoint);
    }
  }

  const disabled = targetPoint == null;

  const onClick = () => {
    if (targetPoint != null) {
      update(targetPoint.time, targetPoint.point);
    }
  };

  return (
    <button
      className={buttonClassName}
      data-test-name="ContinueToButton"
      data-test-state={direction}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon
        className={iconClassName}
        type={direction === "next" ? "continue-to-next" : "continue-to-previous"}
      />
    </button>
  );
}

const findHitPoint = (hitPoints: TimeStampedPoint[], executionPoint: ExecutionPoint) => {
  const hitPoint = hitPoints.find(point => compareExecutionPoints(point.point, executionPoint) > 0);
  if (hitPoint != null) {
    if (isExecutionPointsGreaterThan(hitPoint.point, executionPoint)) {
      return hitPoint;
    }
  }
  return null;
};

const findLastHitPoint = (hitPoints: TimeStampedPoint[], executionPoint: ExecutionPoint) => {
  const hitPoint = findLast(
    hitPoints,
    point => compareExecutionPoints(point.point, executionPoint) < 0
  );
  if (hitPoint != null) {
    if (isExecutionPointsLessThan(hitPoint.point, executionPoint)) {
      return hitPoint;
    }
  }
  return null;
};
