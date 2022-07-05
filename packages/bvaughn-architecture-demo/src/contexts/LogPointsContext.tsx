import { TimeStampedPoint } from "@replayio/protocol";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { getHitPointsForLocation } from "../suspense/PointsCache";

import { Point as LogPoint, PointsContext } from "./PointsContext";

export type LogPointInstance = {
  point: LogPoint;
  timeStampedHitPoint: TimeStampedPoint;
};

type LogPointsContextType = LogPointInstance[];

export const LogPointsContext = createContext<LogPointsContextType>(null as any);

export function LogPointsContextRoot({ children }: PropsWithChildren) {
  const client = useContext(ReplayClientContext);
  const { pointsForAnalysis: points } = useContext(PointsContext);

  const logPointInstances = useMemo<LogPointsContextType>(() => {
    const logPointInstances: LogPointsContextType = [];

    points.forEach(point => {
      if (point.enableLogging) {
        const hitPoints = getHitPointsForLocation(client, point.location);
        hitPoints.forEach(hitPoint => {
          logPointInstances.push({
            point,
            timeStampedHitPoint: hitPoint,
          });
        });
      }
    });

    return logPointInstances;
  }, [client, points]);

  return (
    <LogPointsContext.Provider value={logPointInstances}>{children}</LogPointsContext.Provider>
  );
}
