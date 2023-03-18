import { BreakpointId, Location } from "@replayio/protocol";
import { useContext, useEffect, useRef } from "react";

import { PointBehaviorsObject } from "replay-next/src/contexts/points/types";
import { breakpointPositionsCache } from "replay-next/src/suspense/BreakpointPositionsCache";
import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { POINT_BEHAVIOR_ENABLED, Point, PointKey } from "shared/client/types";
import { ReplayClientInterface } from "shared/client/types";

// Breakpoints must be synced with the server so the stepping controls will work.
export default function useBreakpointIdsFromServer(
  replayClient: ReplayClientInterface,
  points: Point[] | undefined,
  pointBehaviors: PointBehaviorsObject,
  deletePoints: (...keys: PointKey[]) => void
): void {
  const client = useContext(ReplayClientContext);

  const prevPointsRef = useRef<Point[] | null>(null);
  const prevPointBehaviorsRef = useRef<PointBehaviorsObject | null>(null);
  const pointKeyToBreakpointIdMKeyRef = useRef<Map<PointKey, BreakpointId[]>>(new Map());

  useEffect(() => {
    async function setUpBreakpoints() {
      if (points === undefined) {
        return;
      }

      const pointKeyToBreakpointKeyMap = pointKeyToBreakpointIdMKeyRef.current;
      const prevPoints = prevPointsRef.current;
      const prevPointBehaviors = prevPointBehaviorsRef.current;
      if (prevPoints !== points || prevPointBehaviors !== pointBehaviors) {
        if (prevPoints === null) {
          // This should specifically be the case when we're starting up and have points from storage.
          // Here we _need_ to make sure we have breakable positions before we try to add the points,
          // as the backend will throw "Invalid Location" errors if you add points and haven't asked for positions.

          // First, ensure we wait until the client has fetched sources.
          // There's no point (hah!) in restoring breakpoints until after
          // we have sources to work with, and it's also possible that
          // some persisted points have obsolete source IDs.
          const allSources = await sourcesCache.readAsync(replayClient);

          const allSourceIds = new Set<string>();
          for (let source of allSources) {
            allSourceIds.add(source.sourceId);
          }
          const sourcesWithFetchedPositions = new Set<string>();

          const pointsToRemove: string[] = [];

          for (let point of points) {
            const { key, location } = point;
            const { column, line, sourceId } = location;

            const pointBehavior = pointBehaviors[key];

            if (!allSourceIds.has(sourceId)) {
              // It's possible this persisted point has an obsolete
              // `sourceId`. Ignore it, and we'll remove it at the end.
              pointsToRemove.push(key);
              continue;
            }

            if (!sourcesWithFetchedPositions.has(sourceId)) {
              sourcesWithFetchedPositions.add(sourceId);
              // We haven't fetched breakable positions for this yet. Get them.
              await breakpointPositionsCache.readAsync(client, sourceId);
            }

            // _Now_ we can tell the backend about this breakpoint.
            if (pointBehavior?.shouldBreak === POINT_BEHAVIOR_ENABLED) {
              const location: Location = {
                column,
                line,
                sourceId,
              };

              client.breakpointAdded(location, point.condition).then(serverKeys => {
                pointKeyToBreakpointKeyMap.set(key, serverKeys);
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
            const { key } = point;
            const { column, line, sourceId } = point.location;

            const location: Location = {
              column,
              line,
              sourceId,
            };

            const pointBehavior = pointBehaviors[key];
            const prevPointBehavior = prevPointBehaviors?.[key];

            const prevPoint = prevPoints.find(({ key }) => key === point.key);
            if (prevPoint == null) {
              if (pointBehavior?.shouldBreak === POINT_BEHAVIOR_ENABLED) {
                client.breakpointAdded(location, point.condition).then(serverKeys => {
                  pointKeyToBreakpointKeyMap.set(key, serverKeys);
                });
              }
            } else if (prevPointBehavior?.shouldBreak !== pointBehavior?.shouldBreak) {
              if (pointBehavior?.shouldBreak === POINT_BEHAVIOR_ENABLED) {
                client.breakpointAdded(location, point.condition).then(serverKeys => {
                  pointKeyToBreakpointKeyMap.set(key, serverKeys);
                });
              } else {
                const serverKeys = pointKeyToBreakpointKeyMap.get(key);
                if (serverKeys != null) {
                  serverKeys.forEach(serverId => {
                    client.breakpointRemoved(serverId);
                  });
                }
              }
            }
          });

          prevPoints.forEach(prevPoint => {
            const point = points.find(({ key }) => key === prevPoint.key);
            if (point == null) {
              const serverKeys = pointKeyToBreakpointKeyMap.get(prevPoint.key);
              if (serverKeys != null) {
                serverKeys.forEach(serverId => {
                  client.breakpointRemoved(serverId);
                });
              }
            }
          });
        }
      }

      prevPointsRef.current = points;
      prevPointBehaviorsRef.current = pointBehaviors;
    }

    setUpBreakpoints();
  }, [client, deletePoints, pointBehaviors, points, replayClient]);
}
