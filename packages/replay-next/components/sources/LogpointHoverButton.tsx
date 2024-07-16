import { useContext } from "react";

import Icon from "replay-next/components/Icon";
import useGetDefaultLogPointContent from "replay-next/components/sources/hooks/useGetDefaultLogPointContent";
import {
  AddPoint,
  DeletePoints,
  EditPendingPointText,
  EditPointBehavior,
} from "replay-next/src/contexts/points/types";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { Source } from "replay-next/src/suspense/SourcesCache";
import {
  LineHitCounts,
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_ENABLED,
  Point,
  PointBehavior,
} from "shared/client/types";
import { Nag } from "shared/graphql/types";

import styles from "./LogpointHoverButton.module.css";

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

  // For the time being, users can't edit each other's print statements
  const disabled = !!(point?.user && point.user.id !== currentUserInfo?.id);

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
      disabled={disabled}
      onClick={hasOrDidLog ? togglePoint : addLogPoint}
    >
      <Icon className={styles.Icon} type={hasOrDidLog ? "remove" : "add"} />
    </button>
  );
}
