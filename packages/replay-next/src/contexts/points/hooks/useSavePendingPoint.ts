import { Dispatch, SetStateAction, useCallback } from "react";

import { SetLocalPointBehaviors } from "replay-next/src/contexts/points/hooks/useLocalPointBehaviors";
import { POINT_BEHAVIOR_ENABLED, Point, PointKey } from "shared/client/types";

import { CommittedValuesRef } from "../PointsContext";
import { SaveLocalAndRemotePoints, SaveOrDiscardPending } from "../types";

export default function useSavePendingPoint({
  committedValuesRef,
  saveLocalAndRemotePoints,
  setPendingPoints,
  setPointBehaviors,
}: {
  committedValuesRef: CommittedValuesRef;
  saveLocalAndRemotePoints: SaveLocalAndRemotePoints;
  setPendingPoints: Dispatch<SetStateAction<Map<PointKey, Pick<Point, "condition" | "content">>>>;
  setPointBehaviors: SetLocalPointBehaviors;
}) {
  return useCallback<SaveOrDiscardPending>(
    (key: PointKey) => {
      const { pendingPoints } = committedValuesRef.current;
      const pendingPoint = pendingPoints.get(key);
      if (pendingPoint) {
        saveLocalAndRemotePoints(key, pendingPoint);
      }

      setPendingPoints(prev => {
        const cloned = new Map(prev.entries());
        cloned.delete(key);
        return cloned;
      });

      setPointBehaviors(prev => {
        const pointBehavior = prev[key];
        return {
          ...prev,
          [key]: {
            ...pointBehavior,
            shouldLog: POINT_BEHAVIOR_ENABLED,
          },
        };
      });
    },
    [committedValuesRef, saveLocalAndRemotePoints, setPendingPoints, setPointBehaviors]
  );
}
