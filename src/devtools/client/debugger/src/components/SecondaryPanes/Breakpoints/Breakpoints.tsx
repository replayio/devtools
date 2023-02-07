import { SourceId } from "@replayio/protocol";
import { ReactNode, useContext, useMemo } from "react";

import { PointsContext } from "replay-next/src/contexts/PointsContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { POINT_BEHAVIOR_DISABLED, Point } from "shared/client/types";
import { getSourceDetailsEntities } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";

import Breakpoint from "./Breakpoint";
import BreakpointHeading from "./BreakpointHeading";
import styles from "./Breakpoints.module.css";

export type SourceIdToPointsMap = { [key: SourceId]: Point[] };

export default function Breakpoints({
  emptyContent,
  type,
}: {
  emptyContent: ReactNode;
  type: "breakpoint" | "logpoint";
}) {
  const { deletePoints, editPointBehavior, points, pointBehaviors } = useContext(PointsContext);
  const { currentUserInfo } = useContext(SessionContext);

  const sourceDetailsEntities = useAppSelector(getSourceDetailsEntities);

  const filteredAndSortedPoints = useMemo(
    () =>
      points
        .filter(point => {
          // It's possible we may not have source entries for these source IDs.
          // Either we might not have sources fetched yet,
          // or there could be obsolete persisted source IDs for points.
          // Ensure we only show points that have valid sources available.
          const sourceExists = !!sourceDetailsEntities[point.sourceLocation.sourceId];

          const { shouldBreak, shouldLog } = pointBehaviors[point.key] ?? {};

          // Show both enabled and temporarily disabled points.
          // Also show all shared points (even if disabled).
          const behavior = type === "breakpoint" ? shouldBreak : shouldLog;
          const matchesType =
            point.user?.id !== currentUserInfo?.id || behavior !== POINT_BEHAVIOR_DISABLED;

          return sourceExists && matchesType;
        })
        .sort((a, b) => a.sourceLocation.line - b.sourceLocation.line),
    [currentUserInfo, pointBehaviors, points, type, sourceDetailsEntities]
  );

  const sourceIdToPointsMap = useMemo(() => {
    return filteredAndSortedPoints.reduce((map: SourceIdToPointsMap, point) => {
      if (!map.hasOwnProperty(point.sourceLocation.sourceId)) {
        map[point.sourceLocation.sourceId] = [point];
      } else {
        map[point.sourceLocation.sourceId].push(point);
      }
      return map;
    }, {});
  }, [filteredAndSortedPoints]);

  if (filteredAndSortedPoints.length === 0) {
    return (
      <div className={styles.Breakpoints}>
        <div className={styles.Empty}>{emptyContent}</div>
      </div>
    );
  }

  const entries = Object.entries(sourceIdToPointsMap);

  return (
    <div className={styles.Breakpoints}>
      {entries.map(([sourceId, points]) => {
        return (
          <div className={styles.List} data-test-name="BreakpointsList" key={sourceId}>
            <BreakpointHeading
              key="header"
              breakpoint={points[0]}
              sourceId={sourceId}
              onRemoveBreakpoints={() => deletePoints(...points.map(point => point.key))}
            />
            {points.map(point => {
              const pointBehavior = pointBehaviors[point.key];
              const editable = point.user?.id === currentUserInfo?.id;

              return (
                <Breakpoint
                  editable={editable}
                  key={point.key}
                  onEditPointBehavior={editPointBehavior}
                  onRemoveBreakpoint={editable ? () => deletePoints(point.key) : () => {}}
                  point={point}
                  shouldBreak={pointBehavior?.shouldBreak ?? POINT_BEHAVIOR_DISABLED}
                  shouldLog={pointBehavior?.shouldLog ?? POINT_BEHAVIOR_DISABLED}
                  type={type}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
