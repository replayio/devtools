import { SourceId } from "@replayio/protocol";
import { useContext, useMemo } from "react";

import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { SessionContext } from "replay-next/src/contexts/SessionContext";
import { useSourcesById } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { POINT_BEHAVIOR_DISABLED, Point } from "shared/client/types";

import Logpoint from "./Logpoint";
import LogpointHeading from "./LogpointHeading";
import styles from "./LogpointsPane.module.css";

export type SourceIdToPointsMap = { [key: SourceId]: Point[] };

export default function LogpointsPane() {
  const replayClient = useContext(ReplayClientContext);
  const {
    deletePoints,
    editPointBehavior,
    pointsForDefaultPriority: points,
    pointBehaviorsForDefaultPriority: pointBehaviors,
  } = useContext(PointsContext);
  const { currentUserInfo } = useContext(SessionContext);

  const sourceDetailsEntities = useSourcesById(replayClient);

  const filteredAndSortedPoints = useMemo(
    () =>
      points
        .filter(point => {
          // It's possible we may not have source entries for these source IDs.
          // Either we might not have sources fetched yet,
          // or there could be obsolete persisted source IDs for points.
          // Ensure we only show points that have valid sources available.
          const sourceExists = sourceDetailsEntities.has(point.location.sourceId);

          const { shouldLog } = pointBehaviors[point.key] ?? {};

          // Show both enabled and temporarily disabled points.
          // Also show all shared points (even if disabled).
          let matchesType = false;
          if (shouldLog != null) {
            matchesType = shouldLog !== POINT_BEHAVIOR_DISABLED;
          } else {
            // Don't show shared print statements without content;
            // it would be a confusing user experience (since they aren't editable anyway).
            // Note this is an edge case guard that shouldn't be necessary
            // because useRemotePoints filters breaking-only points.
            matchesType = !!point.content;
          }

          return sourceExists && matchesType;
        })
        .sort((a, b) => a.location.line - b.location.line),
    [pointBehaviors, points, sourceDetailsEntities]
  );

  const sourceIdToPointsMap = useMemo(() => {
    return filteredAndSortedPoints.reduce((map: SourceIdToPointsMap, point) => {
      if (!map.hasOwnProperty(point.location.sourceId)) {
        map[point.location.sourceId] = [point];
      } else {
        map[point.location.sourceId].push(point);
      }
      return map;
    }, {});
  }, [filteredAndSortedPoints]);

  if (filteredAndSortedPoints.length === 0) {
    return (
      <div className={styles.LogpointsPane}>
        <div className={styles.Empty}>Click in the editor to add a print statement</div>
      </div>
    );
  }

  const entries = Object.entries(sourceIdToPointsMap);

  return (
    <div className={styles.LogpointsPane}>
      {entries.map(([sourceId, points]) => {
        const allLogPointsAreShared =
          points.filter(point => point.user?.id == currentUserInfo?.id).length === 0;

        return (
          <div className={styles.List} data-test-name="LogPointsList" key={sourceId}>
            <LogpointHeading
              allLogPointsAreShared={allLogPointsAreShared}
              logPoint={points[0]}
              key="header"
              onRemoveLogPoints={() => deletePoints(...points.map(point => point.key))}
              sourceId={sourceId}
            />
            {points.map(point => {
              const pointBehavior = pointBehaviors[point.key];
              const editable = point.user?.id === currentUserInfo?.id;

              return (
                <Logpoint
                  currentUserInfo={currentUserInfo}
                  editable={editable}
                  key={point.key}
                  onEditPointBehavior={editPointBehavior}
                  onRemoveLogPoint={editable ? () => deletePoints(point.key) : () => {}}
                  point={point}
                  shouldLog={pointBehavior?.shouldLog ?? POINT_BEHAVIOR_DISABLED}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
