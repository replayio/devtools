import { BreakpointId } from "@replayio/protocol";
import { useContext, useEffect, useRef } from "react";

import { getBreakpointPositionsAsync } from "replay-next/src/suspense/SourcesCache";
import { getSourcesAsync } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { POINT_BEHAVIOR_ENABLED, Point, PointId } from "shared/client/types";
import { ReplayClientInterface } from "shared/client/types";

// Breakpoints must be synced with the server so the stepping controls will work.
export default function useBreakpointIdsFromServer(
  replayClient: ReplayClientInterface,
  points: Point[] | undefined,
  deletePoints: (...ids: PointId[]) => void
): void {
  const client = useContext(ReplayClientContext);

  const prevPointsRef = useRef<Point[] | null>(null);
  const pointIdToBreakpointIdMapRef = useRef<Map<PointId, BreakpointId[]>>(new Map());

  useEffect(() => {
    async function setUpBreakpoints() {
      if (points === undefined) {
        return;
      }

      const pointIdToBreakpointIdMap = pointIdToBreakpointIdMapRef.current;
      const prevPoints = prevPointsRef.current;
      if (prevPoints !== points) {
        if (prevPoints === null) {
          // This should specifically be the case when we're starting up and have points from storage.
          // Here we _need_ to make sure we have breakable positions before we try to add the points,
          // as the backend will throw "Invalid Location" errors if you add points and haven't asked for positions.

          // First, ensure we wait until the client has fetched sources.
          // There's no point (hah!) in restoring breakpoints until after
          // we have sources to work with, and it's also possible that
          // some persisted points have obsolete source IDs.
          const allSources = await getSourcesAsync(replayClient);

          const allSourceIds = new Set<string>();
          for (let source of allSources) {
            allSourceIds.add(source.sourceId);
          }
          const sourcesWithFetchedPositions = new Set<string>();

          const pointsToRemove: string[] = [];

          for (let point of points) {
            const { sourceId } = point.location;
            if (!allSourceIds.has(sourceId)) {
              // It's possible this persisted point has an obsolete
              // `sourceId`. Ignore it, and we'll remove it at the end.
              pointsToRemove.push(point.id);
              continue;
            }

            if (!sourcesWithFetchedPositions.has(sourceId)) {
              sourcesWithFetchedPositions.add(sourceId);
              // We haven't fetched breakable positions for this yet. Get them.
              await getBreakpointPositionsAsync(client, point.location.sourceId);
            }

            // _Now_ we can tell the backend about this breakpoint.
            if (point.shouldBreak === POINT_BEHAVIOR_ENABLED) {
              client.breakpointAdded(point.location, point.condition).then(serverIds => {
                pointIdToBreakpointIdMap.set(point.id, serverIds);
              });
            }
          }

          if (pointsToRemove.length > 0) {
            // Sync up the points in memory to remove any obsolete points we saw.
            deletePoints(...pointsToRemove);
          }
        } else {
          // The user has probably been interacting with the app and we _should_ have breakable positions
          // for these files already.
          points.forEach(point => {
            const prevPoint = prevPoints.find(({ id }) => id === point.id);
            if (prevPoint == null) {
              if (point.shouldBreak === POINT_BEHAVIOR_ENABLED) {
                client.breakpointAdded(point.location, point.condition).then(serverIds => {
                  pointIdToBreakpointIdMap.set(point.id, serverIds);
                });
              }
            } else if (prevPoint.shouldBreak !== point.shouldBreak) {
              if (point.shouldBreak === POINT_BEHAVIOR_ENABLED) {
                client.breakpointAdded(point.location, point.condition).then(serverIds => {
                  pointIdToBreakpointIdMap.set(point.id, serverIds);
                });
              } else {
                const serverIds = pointIdToBreakpointIdMap.get(point.id);
                if (serverIds != null) {
                  serverIds.forEach(serverId => {
                    client.breakpointRemoved(serverId);
                  });
                }
              }
            }
          });

          prevPoints.forEach(prevPoint => {
            const point = points.find(({ id }) => id === prevPoint.id);
            if (point == null) {
              const serverIds = pointIdToBreakpointIdMap.get(prevPoint.id);
              if (serverIds != null) {
                serverIds.forEach(serverId => {
                  client.breakpointRemoved(serverId);
                });
              }
            }
          });
        }
      }

      prevPointsRef.current = points;
    }

    setUpBreakpoints();
  }, [client, deletePoints, points, replayClient]);
}
