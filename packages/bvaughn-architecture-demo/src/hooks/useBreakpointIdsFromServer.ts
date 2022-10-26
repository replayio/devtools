import { BreakpointId } from "@replayio/protocol";
import { useContext, useEffect, useRef } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point, PointId } from "shared/client/types";
import { getBreakpointPositionsAsync } from "bvaughn-architecture-demo/src/suspense/SourcesCache";

// Breakpoints must be synced with the server so the stepping controls will work.
export default function useBreakpointIdsFromServer(
  points: Point[],
  editPoint: (id: PointId, partialPoint: Partial<Point>) => void
): void {
  const client = useContext(ReplayClientContext);

  const prevPointsRef = useRef<Point[] | null>(null);
  const pointIdToBreakpointIdMapRef = useRef<Map<PointId, BreakpointId[]>>(new Map());

  useEffect(() => {
    async function setUpBreakpoints() {
      const pointIdToBreakpointIdMap = pointIdToBreakpointIdMapRef.current;
      const prevPoints = prevPointsRef.current;
      if (prevPoints !== points) {
        if (prevPoints === null) {
          // This should specifically be the case when we're starting up and have points from storage.
          // Here we _need_ to make sure we have breakable positions before we try to add the points,
          // as the backend will throw "Invalid Location" errors if you add points and haven't asked for positions.

          const sourcesWithFetchedPositions = new Set<string>();

          for (let point of points) {
            if (!sourcesWithFetchedPositions.has(point.location.sourceId)) {
              sourcesWithFetchedPositions.add(point.location.sourceId);
              await getBreakpointPositionsAsync(client, point.location.sourceId);
            }
            client.breakpointAdded(point.location, point.condition).then(serverIds => {
              pointIdToBreakpointIdMap.set(point.id, serverIds);
            });
          }
        } else {
          // The user has probably been interacting with the app and we _should_ have breakable positions
          // for these files already.
          points.forEach(point => {
            const prevPoint = prevPoints.find(({ id }) => id === point.id);
            if (prevPoint == null) {
              if (point.shouldBreak) {
                client.breakpointAdded(point.location, point.condition).then(serverIds => {
                  pointIdToBreakpointIdMap.set(point.id, serverIds);
                });
              }
            } else if (prevPoint.shouldBreak !== point.shouldBreak) {
              if (point.shouldBreak) {
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
  }, [client, editPoint, points]);
}
