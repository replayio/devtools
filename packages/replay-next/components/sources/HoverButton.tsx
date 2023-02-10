import { ExecutionPoint, newSource as ProtocolSource, TimeStampedPoint } from "@replayio/protocol";
import findLast from "lodash/findLast";
import { useContext } from "react";

import Icon from "replay-next/components/Icon";
import { SetLinePointState } from "replay-next/components/sources/SourceListRow";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { KeyboardModifiersContext } from "replay-next/src/contexts/KeyboardModifiersContext";
import {
  AddPoint,
  DeletePoints,
  EditPointBehavior,
  EditPointText,
} from "replay-next/src/contexts/points/types";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { SourcesContext } from "replay-next/src/contexts/SourcesContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { getHitPointsForLocationSuspense } from "replay-next/src/suspense/ExecutionPointsCache";
import {
  compareExecutionPoints,
  isExecutionPointsGreaterThan,
  isExecutionPointsLessThan,
} from "replay-next/src/utils/time";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_ENABLED,
  Point,
  PointBehavior,
} from "shared/client/types";
import { LineHitCounts } from "shared/client/types";
import { TOO_MANY_POINTS_TO_FIND } from "shared/constants";
import { Nag } from "shared/graphql/types";

import styles from "./HoverButton.module.css";

export default function HoverButton({
  addPoint,
  buttonClassName,
  deletePoints,
  editPointText,
  editPointBehavior,
  iconClassName,
  lineHitCounts,
  lineNumber,
  point,
  pointBehavior,
  setLinePointState,
  source,
}: {
  addPoint: AddPoint;
  buttonClassName: string;
  deletePoints: DeletePoints;
  editPointText: EditPointText;
  editPointBehavior: EditPointBehavior;
  iconClassName: string;
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  point: Point | null;
  pointBehavior: PointBehavior | null;
  setLinePointState: SetLinePointState;
  source: ProtocolSource;
}) {
  const { range: focusRange } = useContext(FocusContext);
  const { isMetaKeyActive, isShiftKeyActive } = useContext(KeyboardModifiersContext);
  const client = useContext(ReplayClientContext);
  const { executionPoint, update } = useContext(TimelineContext);
  const { currentUserInfo } = useContext(SessionContext);
  const { findClosestFunctionName } = useContext(SourcesContext);

  const [showNag, dismissNag] = useNag(Nag.FIRST_BREAKPOINT_ADD);

  if (point?.user && point.user.id !== currentUserInfo?.id) {
    return null;
  }

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
        update(targetPoint.time, targetPoint.point, false);
      }
    };

    return (
      <button
        className={`${buttonClassName} ${styles.Button}`}
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

      dismissNag();

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
        editPointText(point.key, { content });
        editPointBehavior(point.key, { shouldLog: POINT_BEHAVIOR_ENABLED });
      } else {
        addPoint(
          {
            content,
          },
          {
            shouldLog: POINT_BEHAVIOR_ENABLED,
          },
          location
        );

        setLinePointState(lineNumber - 1, "point");
      }
    };

    const { shouldBreak = POINT_BEHAVIOR_DISABLED, shouldLog = POINT_BEHAVIOR_DISABLED } =
      pointBehavior || {};

    // If a point's behavior has been temporarily disabled, the hover button should take that into account.
    const hasOrDidBreak = shouldBreak !== POINT_BEHAVIOR_DISABLED;
    const hasOrDidLog = shouldLog !== POINT_BEHAVIOR_DISABLED;

    const togglePoint = () => {
      if (point) {
        if (!hasOrDidLog || hasOrDidBreak) {
          const newShouldLog = hasOrDidLog ? POINT_BEHAVIOR_DISABLED : POINT_BEHAVIOR_ENABLED;
          editPointBehavior(point.key, {
            shouldLog: newShouldLog,
          });

          if (!newShouldLog) {
            setLinePointState(lineNumber - 1, null);
          }
        } else {
          deletePoints(point.key);

          setLinePointState(lineNumber - 1, null);
        }
      }
    };

    return (
      <button
        className={`${buttonClassName} ${showNag ? styles.ButtonWithNag : styles.Button}`}
        data-test-name="LogPointToggle"
        data-test-state={hasOrDidLog ? "on" : "off"}
        onClick={hasOrDidLog ? togglePoint : addLogPoint}
      >
        <Icon className={iconClassName} type={hasOrDidLog ? "remove" : "add"} />
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
