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
  const pointIdToBreakpointIdMapRef = useRef<Map<PointId, BreakpointId>>(new Map());

  useEffect(() => {
    const pointIdToBreakpointIdMap = pointIdToBreakpointIdMapRef.current;
    const prevPoints = prevPointsRef.current;
    if (prevPoints !== points) {
      if (prevPoints === null) {
        points.forEach(point => {
          // TODO [BAC-2328] Remove the async update
          client.breakpointAdded(point).then(serverId => {
            pointIdToBreakpointIdMap.set(point.id, serverId);
          });
        });
      } else {
        points.forEach(point => {
          const prevPoint = prevPoints.find(({ id }) => id === point.id);
          if (prevPoint == null) {
            if (point.shouldBreak) {
              // TODO [BAC-2328] Remove the async update
              client.breakpointAdded(point).then(serverId => {
                pointIdToBreakpointIdMap.set(point.id, serverId);
              });
            }
          } else if (prevPoint.shouldBreak !== point.shouldBreak) {
            if (point.shouldBreak) {
              // TODO [BAC-2328] Remove the async update
              client.breakpointAdded(point).then(serverId => {
                pointIdToBreakpointIdMap.set(point.id, serverId);
              });
            } else {
              const serverId = pointIdToBreakpointIdMap.get(point.id);
              if (serverId != null) {
                // TODO [BAC-2328] Pass location and condition as id
                client.breakpointRemoved(serverId);
              }
            }
          }
        });

        prevPoints.forEach(prevPoint => {
          const point = prevPoints.find(({ id }) => id === prevPoint.id);
          if (point == null) {
            const serverId = pointIdToBreakpointIdMap.get(prevPoint.id);
            if (serverId != null) {
              // TODO [BAC-2328] Pass location and condition as id
              client.breakpointRemoved(serverId);
            }
          }
        });
      }
    }

    prevPointsRef.current = points;
  }, [client, editPoint, points]);
}
