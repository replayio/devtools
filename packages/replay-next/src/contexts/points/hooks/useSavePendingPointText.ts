import { Dispatch, SetStateAction, useCallback } from "react";

import { pointEquals } from "protocol/execution-point-utils";
import { SetLocalPointBehaviors } from "replay-next/src/contexts/points/hooks/useLocalPointBehaviors";
import { POINT_BEHAVIOR_ENABLED, Point, PointKey } from "shared/client/types";

import { CommittedValuesRef } from "../PointsContext";
import { SaveLocalAndRemotePoints, SaveOrDiscardPendingText } from "../types";

export default function useSavePendingPointText({
  committedValuesRef,
  saveLocalAndRemotePoints,
  setPendingPointText,
  setPointBehaviors,
}: {
  committedValuesRef: CommittedValuesRef;
  saveLocalAndRemotePoints: SaveLocalAndRemotePoints;
  setPendingPointText: Dispatch<
    SetStateAction<Map<PointKey, Pick<Point, "condition" | "content">>>
  >;
  setPointBehaviors: SetLocalPointBehaviors;
}) {
  return useCallback<SaveOrDiscardPendingText>(
    (key: PointKey) => {
      const { pendingPointText } = committedValuesRef.current;
      const pendingPoint = pendingPointText.get(key);
      if (pendingPoint) {
        saveLocalAndRemotePoints(key, pendingPoint);
      }

      setPendingPointText(prev => {
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
    [committedValuesRef, saveLocalAndRemotePoints, setPendingPointText, setPointBehaviors]
  );
}
