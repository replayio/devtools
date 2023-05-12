import { Dispatch, SetStateAction, useCallback } from "react";

import { Point, PointKey } from "shared/client/types";

import { SaveOrDiscardPending } from "../types";

export default function useDiscardPendingPoint({
  setPendingPoints,
}: {
  setPendingPoints: Dispatch<SetStateAction<Map<PointKey, Pick<Point, "condition" | "content">>>>;
}) {
  return useCallback<SaveOrDiscardPending>(
    (key: PointKey) => {
      setPendingPoints(prev => {
        const cloned = new Map(prev.entries());
        cloned.delete(key);
        return cloned;
      });
    },
    [setPendingPoints]
  );
}
