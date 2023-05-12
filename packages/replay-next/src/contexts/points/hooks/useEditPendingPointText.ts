import { Dispatch, SetStateAction, useCallback } from "react";

import { Point, PointKey } from "shared/client/types";

import { CommittedValuesRef } from "../PointsContext";
import { EditPendingPointText } from "../types";

export default function useEditPendingPointText({
  committedValuesRef,
  setPendingPointText,
}: {
  committedValuesRef: CommittedValuesRef;
  setPendingPointText: Dispatch<
    SetStateAction<Map<PointKey, Pick<Point, "condition" | "content">>>
  >;
}): EditPendingPointText {
  return useCallback<EditPendingPointText>(
    (key: PointKey, partialPoint: Partial<Pick<Point, "condition" | "content">>) => {
      const { pendingPointText, points } = committedValuesRef.current;
      const prevPendingPoint = pendingPointText.get(key);
      const prevSavedPoint = points.find(point => point.key === key);

      const pendingPoint: Point = {
        ...(prevSavedPoint as Point),
        ...prevPendingPoint,
        ...partialPoint,
      };

      setPendingPointText(prev => {
        const cloned = new Map(prev.entries());
        // Store only the Point attributes that this hook is concerned with;
        // other attributes may be stale
        cloned.set(key, {
          condition: pendingPoint.condition,
          content: pendingPoint.content,
        });
        return cloned;
      });
    },
    [committedValuesRef, setPendingPointText]
  );
}
