import { Dispatch, SetStateAction, useCallback } from "react";

import { Point, PointKey } from "shared/client/types";

import { CommittedValuesRef } from "../PointsContext";
import { EditPendingPoint } from "../types";

export default function useEditPendingPoint({
  committedValuesRef,
  setPendingPoints,
}: {
  committedValuesRef: CommittedValuesRef;
  setPendingPoints: Dispatch<SetStateAction<Map<PointKey, Pick<Point, "condition" | "content">>>>;
}): EditPendingPoint {
  return useCallback<EditPendingPoint>(
    (key: PointKey, partialPoint: Partial<Pick<Point, "condition" | "content">>) => {
      const { pendingPoints, points } = committedValuesRef.current;
      const prevPendingPoint = pendingPoints.get(key);
      const prevSavedPoint = points.find(point => point.key === key);

      const point: Point = {
        ...(prevSavedPoint as Point),
        ...prevPendingPoint,
        ...partialPoint,
      };

      setPendingPoints(prev => {
        const cloned = new Map(prev.entries());
        // Store only the Point attributes that this hook is concerned with;
        // other attributes may be stale
        cloned.set(key, {
          condition: point.condition,
          content: point.content,
        });
        return cloned;
      });
    },
    [committedValuesRef, setPendingPoints]
  );
}
