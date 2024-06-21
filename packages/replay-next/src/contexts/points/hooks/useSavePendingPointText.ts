import { Dispatch, SetStateAction, useCallback } from "react";

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
    (key: PointKey, partialPoint?: Partial<Pick<Point, "condition" | "content">>) => {
      const { pendingPointText } = committedValuesRef.current;
      const pendingPoint = partialPoint ?? pendingPointText.get(key);
      if (pendingPoint) {
        saveLocalAndRemotePoints(key, pendingPoint);

        // Clear pending edits from the Map once they've been saved
        setPendingPointText(prev => {
          const cloned = new Map(prev.entries());
          cloned.delete(key);
          return cloned;
        });
      }

      setPointBehaviors(prev => {
        const pointBehavior = prev[key];
        return prev[key].shouldLog === POINT_BEHAVIOR_ENABLED
          ? prev
          : {
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
