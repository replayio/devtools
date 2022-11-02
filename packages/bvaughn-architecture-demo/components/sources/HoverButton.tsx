import { ExecutionPoint, newSource as ProtocolSource, TimeStampedPoint } from "@replayio/protocol";
import findLast from "lodash/findLast";
import { useContext, useMemo } from "react";

import Icon from "bvaughn-architecture-demo/components/Icon";
import { FocusContext } from "bvaughn-architecture-demo/src/contexts/FocusContext";
import { KeyboardModifiersContext } from "bvaughn-architecture-demo/src/contexts/KeyboardModifiersContext";
import {
  AddPoint,
  DeletePoints,
  EditPoint,
} from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { SessionContext } from "bvaughn-architecture-demo/src/contexts/SessionContext";
import { SourcesContext } from "bvaughn-architecture-demo/src/contexts/SourcesContext";
import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";
import { getHitPointsForLocationSuspense } from "bvaughn-architecture-demo/src/suspense/PointsCache";
import {
  compareExecutionPoints,
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "bvaughn-architecture-demo/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point } from "shared/client/types";
import { LineHitCounts } from "shared/client/types";
import { TOO_MANY_POINTS_TO_FIND } from "shared/constants";

export default function HoverButton({
  addPoint,
  buttonClassName,
  deletePoints,
  editPoint,
  iconClassName,
  lineHitCounts,
  lineNumber,
  point,
  source,
}: {
  addPoint: AddPoint;
  buttonClassName: string;
  deletePoints: DeletePoints;
  editPoint: EditPoint;
  iconClassName: string;
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  point: Point | null;
  source: ProtocolSource;
}) {
  const { range: focusRange } = useContext(FocusContext);
  const { isMetaKeyActive, isShiftKeyActive } = useContext(KeyboardModifiersContext);
  const client = useContext(ReplayClientContext);
  const { executionPoint, update } = useContext(TimelineContext);
  const { findClosestFunctionName } = useContext(SourcesContext);
  const { trackEvent } = useContext(SessionContext);

  if (isMetaKeyActive) {
    if (lineHitCounts === null) {
      return null;
    }

    const [hitPoints, hitPointStatus] =
      lineHitCounts.count >= TOO_MANY_POINTS_TO_FIND
        ? [null, null]
        : getHitPointsForLocationSuspense(
            client,
            {
              column: lineHitCounts.firstBreakableColumnIndex,
              line: lineNumber,
              sourceId: source.sourceId,
            },
            null,
            focusRange
          );

    let targetPoint: TimeStampedPoint | null = null;
    if (hitPoints !== null && hitPointStatus !== "too-many-points-to-find") {
      if (isShiftKeyActive) {
        targetPoint = findLastHitPoint(hitPoints, executionPoint);
      } else {
        targetPoint = findHitPoint(hitPoints, executionPoint);
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
        data-test-state={isShiftKeyActive ? "previous" : "next"}
        disabled={disabled}
        onClick={onClick}
      >
        <Icon
          className={iconClassName}
          type={isShiftKeyActive ? "continue-to-previous" : "continue-to-next"}
        />
      </button>
    );
  } else {
    const addLogPoint = () => {
      if (lineHitCounts === null) {
        return;
      }

      const fileName = source?.url?.split("/")?.pop();
      let content = `"${fileName}", ${lineNumber}`;
      const location = {
        column: lineHitCounts.firstBreakableColumnIndex,
        line: lineNumber,
        sourceId: source.sourceId,
      };
      if (source?.sourceId) {
        const closestFunctionName = findClosestFunctionName(source?.sourceId, location);
        if (closestFunctionName) {
          content = `"${closestFunctionName}", ${lineNumber}`;
        }
      }

      if (point) {
        editPoint(point.id, { content, shouldLog: true });
      } else {
        // Distinct from "breakpoint.add" apparently
        trackEvent("breakpoint.plus_click");

        addPoint(
          {
            content,
            shouldLog: true,
          },
          location
        );
      }
    };

    const togglePoint = () => {
      if (point) {
        if (!point.shouldLog || point.shouldBreak) {
          editPoint(point.id, { shouldLog: !point.shouldLog });
        } else {
          trackEvent("breakpoint.minus_click");
          deletePoints(point.id);
        }
      }
    };

    return (
      <button
        className={buttonClassName}
        data-test-name="LogPointToggle"
        data-test-state={point?.shouldLog ? "on" : "off"}
        onClick={point?.shouldLog ? togglePoint : addLogPoint}
      >
        <Icon className={iconClassName} type={point?.shouldLog ? "remove" : "add"} />
      </button>
    );
  }
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
