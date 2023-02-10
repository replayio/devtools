import { PropsWithChildren, createContext, useContext, useDeferredValue, useMemo } from "react";

import { Point } from "shared/client/types";

import { PointsContextDangerousToUseDirectly as PointsContext } from "./PointsContext";
import { PointBehaviorsObject } from "./types";

export type ContextType = {
  // Points or behaviors have a pending transition.
  // Components may want to render a high priority, non-suspense update (e.g. dim or spinner).
  isPending: boolean;

  // These values are updated at transition priority.
  // They are intended for use with components that suspend.
  pointBehaviors: PointBehaviorsObject;
  points: Point[];
};

export const Context = createContext<ContextType>(null as unknown as ContextType);

export function ContextRoot({ children }: PropsWithChildren) {
  const { points, pointBehaviors } = useContext(PointsContext);

  const deferredPoints = useDeferredValue(points);
  const deferredPointBehaviors = useDeferredValue(pointBehaviors);

  const isPending = deferredPoints !== points || deferredPointBehaviors !== pointBehaviors;

  const context = useMemo<ContextType>(
    () => ({
      isPending,
      pointBehaviors: deferredPointBehaviors,
      points: deferredPoints,
    }),
    [deferredPointBehaviors, deferredPoints, isPending]
  );

  return <Context.Provider value={context}>{children}</Context.Provider>;
}
