import { Dispatch, SetStateAction, useCallback } from "react";

import { Point, PointKey } from "shared/client/types";

import { SaveOrDiscardPendingText } from "../types";

export default function useDiscardPendingPointText({
  setPendingPointText,
}: {
  setPendingPointText: Dispatch<
    SetStateAction<Map<PointKey, Pick<Point, "condition" | "content">>>
  >;
}) {
  return useCallback<SaveOrDiscardPendingText>(
    (key: PointKey) => {
      setPendingPointText(prev => {
        const cloned = new Map(prev.entries());
        cloned.delete(key);
        return cloned;
      });
    },
    [setPendingPointText]
  );
}
