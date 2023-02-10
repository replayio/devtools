import { Dispatch, SetStateAction, useCallback } from "react";

import { Point, PointKey } from "shared/client/types";

import { CommittedValuesRef } from "../PointsContext";
import { SaveLocalAndRemotePoints, SaveOrDiscardPendingText } from "../types";

export default function useSavePendingPointText({
  committedValuesRef,
  saveLocalAndRemotePoints,
  setPendingPointText,
}: {
  committedValuesRef: CommittedValuesRef;
  saveLocalAndRemotePoints: SaveLocalAndRemotePoints;
  setPendingPointText: Dispatch<
    SetStateAction<Map<PointKey, Pick<Point, "condition" | "content">>>
  >;
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
    },
    [committedValuesRef, saveLocalAndRemotePoints, setPendingPointText]
  );
}
