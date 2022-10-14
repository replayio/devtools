import { BreakpointId } from "@replayio/protocol";
import { useContext, useEffect, useRef } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { Point, PointId } from "shared/client/types";

// Breakpoints must be synced with the server so the stepping controls will work.
export default function useBreakpointIdsFromServer(
  points: Point[],
  editPoint: (id: PointId, partialPoint: Partial<Point>) => void
): void {
  const client = useContext(ReplayClientContext);

  const prevPointsRef = useRef<Point[] | null>(null);
  const pointIdToBreakpointIdMapRef = useRef<Map<PointId, BreakpointId[]>>(new Map());

  useEffect(() => {
    const pointIdToBreakpointIdMap = pointIdToBreakpointIdMapRef.current;
    const prevPoints = prevPointsRef.current;
    if (prevPoints !== points) {
      if (prevPoints === null) {
        points.forEach(point => {
          client.breakpointAdded(point).then(serverIds => {
            pointIdToBreakpointIdMap.set(point.id, serverIds);
          });
        });
      } else {
        points.forEach(point => {
          const prevPoint = prevPoints.find(({ id }) => id === point.id);
          if (prevPoint == null) {
            if (point.shouldBreak) {
              client.breakpointAdded(point).then(serverIds => {
                pointIdToBreakpointIdMap.set(point.id, serverIds);
              });
            }
          } else if (prevPoint.shouldBreak !== point.shouldBreak) {
            if (point.shouldBreak) {
              client.breakpointAdded(point).then(serverIds => {
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
  }, [client, editPoint, points]);
}
