import { TimeStampedPoint } from "@replayio/protocol";
import { Suspense, useContext } from "react";

import Icon from "replay-next/components/Icon";
import useGetDefaultLogPointContent from "replay-next/components/sources/hooks/useGetDefaultLogPointContent";
import { findLastHitPoint } from "replay-next/components/sources/utils/findLastHitPoint";
import { findNextHitPoint } from "replay-next/components/sources/utils/findNextHitPoints";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { KeyboardModifiersContext } from "replay-next/src/contexts/KeyboardModifiersContext";
import {
  AddPoint,
  DeletePoints,
  EditPendingPointText,
  EditPointBehavior,
} from "replay-next/src/contexts/points/types";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { hitPointsForLocationCache } from "replay-next/src/suspense/HitPointsCache";
import { Source } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import {
  HitPointStatus,
  LineHitCounts,
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_ENABLED,
  Point,
  PointBehavior,
} from "shared/client/types";
import { TOO_MANY_POINTS_TO_FIND } from "shared/constants";
import { Nag } from "shared/graphql/types";

import styles from "./HoverButton.module.css";

export default function HoverButton({
  addPoint,
  deletePoints,
  editPendingPointText,
  editPointBehavior,
  lineHitCounts,
  lineNumber,
  point,
  pointBehavior,
  source,
}: {
  addPoint: AddPoint;
  deletePoints: DeletePoints;
  editPendingPointText: EditPendingPointText;
  editPointBehavior: EditPointBehavior;
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  point: Point | null;
  pointBehavior: PointBehavior | null;
  source: Source;
}) {
  const { isMetaKeyActive } = useContext(KeyboardModifiersContext);

  // Don't render a hover button for lines that have no hits at all
  if (!lineHitCounts) {
    return null;
  }

  if (isMetaKeyActive) {
    return (
      <Suspense fallback={null}>
        <MetaHoverButton lineHitCounts={lineHitCounts} lineNumber={lineNumber} source={source} />
      </Suspense>
    );
  } else {
    return (
      <NormalHoverButton
        addPoint={addPoint}
        deletePoints={deletePoints}
        editPendingPointText={editPendingPointText}
        editPointBehavior={editPointBehavior}
        lineHitCounts={lineHitCounts}
        lineNumber={lineNumber}
        point={point}
        pointBehavior={pointBehavior}
        source={source}
      />
    );
  }
}

function MetaHoverButton({
  lineHitCounts,
  lineNumber,
  source,
}: {
  lineHitCounts: LineHitCounts | null;
  lineNumber: number;
  source: Source;
}) {
  const { rangeForSuspense: focusRange } = useContext(FocusContext);
  const { isShiftKeyActive } = useContext(KeyboardModifiersContext);
  const replayClient = useContext(ReplayClientContext);
  const { executionPoint, update } = useContext(TimelineContext);

  let hitPoints: TimeStampedPoint[] | null = null;
  let hitPointStatus: HitPointStatus | null = null;
  if (lineHitCounts != null && lineHitCounts.count < TOO_MANY_POINTS_TO_FIND && focusRange) {
    const tuple = hitPointsForLocationCache.read(
      replayClient,
      { begin: focusRange.begin.point, end: focusRange.end.point },
      {
        column: lineHitCounts.firstBreakableColumnIndex,
        line: lineNumber,
        sourceId: source.id,
      },
      null
    );

    hitPoints = tuple[0];
    hitPointStatus = tuple[1];
  }

  let targetPoint: TimeStampedPoint | null = null;
  if (executionPoint && hitPoints !== null && hitPointStatus !== "too-many-points-to-find") {
    if (isShiftKeyActive) {
      targetPoint = findLastHitPoint(hitPoints, executionPoint);
    } else {
      targetPoint = findNextHitPoint(hitPoints, executionPoint);
    }
  }

  const disabled = targetPoint == null;

  const onClick = () => {
    if (targetPoint != null) {
      const location = {
        column: lineHitCounts?.firstBreakableColumnIndex ?? 0,
        line: lineNumber,
        sourceId: source.id,
      };
      update(targetPoint.time, targetPoint.point, false, location);
    }
  };

  return (
    <button
      className={styles.Button}
      data-test-name="ContinueToButton"
      data-test-state={isShiftKeyActive ? "previous" : "next"}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon type={isShiftKeyActive ? "continue-to-previous" : "continue-to-next"} />
    </button>
  );
}

function NormalHoverButton({
  addPoint,
  deletePoints,
  editPendingPointText,
  editPointBehavior,
  lineHitCounts,
  lineNumber,
  point,
  pointBehavior,
  source,
}: {
  addPoint: AddPoint;
  deletePoints: DeletePoints;
  editPendingPointText: EditPendingPointText;
  editPointBehavior: EditPointBehavior;
  lineHitCounts: LineHitCounts;
  lineNumber: number;
  point: Point | null;
  pointBehavior: PointBehavior | null;
  source: Source;
}) {
  const { currentUserInfo } = useContext(SessionContext);

  const getDefaultLogPointContent = useGetDefaultLogPointContent({
    lineHitCounts,
    lineNumber,
    source,
  });

  const [showNag, dismissNag] = useNag(Nag.FIRST_PRINT_STATEMENT_ADD);

  // Don't render hover buttons when other user's hit points already exist on the line
  if (point?.user && point.user.id !== currentUserInfo?.id) {
    return null;
  }

  const addLogPoint = () => {
    const content = getDefaultLogPointContent();
    if (!content) {
      return;
    }

    dismissNag();

    const location = {
      column: lineHitCounts.firstBreakableColumnIndex,
      line: lineNumber,
      sourceId: source.sourceId,
    };

    if (point) {
      editPendingPointText(point.key, { content });
      editPointBehavior(
        point.key,
        { shouldLog: POINT_BEHAVIOR_ENABLED },
        point.user?.id === currentUserInfo?.id
      );
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
    }
  };

  const { shouldLog = point?.content ? POINT_BEHAVIOR_ENABLED : POINT_BEHAVIOR_DISABLED } =
    pointBehavior || {};

  // If a point's behavior has been temporarily disabled, the hover button should take that into account.
  const hasOrDidLog = shouldLog !== POINT_BEHAVIOR_DISABLED;

  const togglePoint = () => {
    if (point) {
      if (!hasOrDidLog) {
        const newShouldLog = hasOrDidLog ? POINT_BEHAVIOR_DISABLED : POINT_BEHAVIOR_ENABLED;
        editPointBehavior(
          point.key,
          {
            shouldLog: newShouldLog,
          },
          point.user?.id === currentUserInfo?.id
        );
      } else {
        deletePoints(point.key);
      }
    }
  };

  return (
    <button
      className={showNag ? styles.ButtonWithNag : styles.Button}
      data-test-name="LogPointToggle"
      data-test-state={hasOrDidLog ? "on" : "off"}
      onClick={hasOrDidLog ? togglePoint : addLogPoint}
    >
      <Icon type={hasOrDidLog ? "remove" : "add"} />
    </button>
  );
}
