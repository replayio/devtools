import { TimeStampedPoint } from "@replayio/protocol";
import type { Token } from "js-tokens";
import jsTokens from "js-tokens";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { getHitPointsForLocation } from "../suspense/PointsCache";
import { runLocalAnalysis } from "../utils/points";

import { Point as LogPoint, PointsContext } from "./PointsContext";

export type LogPointInstance = {
  contents: Token[] | null;
  hitPoint: TimeStampedPoint;
  point: LogPoint;
  requiresAnalysis: boolean;
};

type LogPointsContextType = LogPointInstance[];

export const LogPointsContext = createContext<LogPointsContextType>(null as any);

export function LogPointsContextRoot({ children }: PropsWithChildren) {
  const client = useContext(ReplayClientContext);
  const { points } = useContext(PointsContext);

  const logPointInstances = useMemo<LogPointsContextType>(() => {
    const logPointInstances: LogPointsContextType = [];

    points.forEach(point => {
      if (point.enableLogging) {
        const hitPoints = getHitPointsForLocation(client, point.location);
        hitPoints.forEach(hitPoint => {
          let contents = null;
          let requiresAnalysis = true;
          try {
            contents = runLocalAnalysis(point.content);
            requiresAnalysis = false;
          } catch (error) {}

          logPointInstances.push({
            contents,
            hitPoint,
            point,
            requiresAnalysis,
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
