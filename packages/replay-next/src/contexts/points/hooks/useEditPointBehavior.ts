import { useCallback } from "react";

import { TrackEvent } from "replay-next/src/contexts/SessionContext";
import { POINT_BEHAVIOR_DISABLED, PointBehavior, PointKey } from "shared/client/types";

import { CommittedValuesRef } from "../PointsContext";
import { EditPointBehavior } from "../types";
import { SetLocalPointBehaviors } from "./useLocalPointBehaviors";

export default function useEditPointBehavior({
  committedValuesRef,
  setPointBehaviors,
  trackEvent,
}: {
  committedValuesRef: CommittedValuesRef;
  setPointBehaviors: SetLocalPointBehaviors;
  trackEvent: TrackEvent;
}): EditPointBehavior {
  return useCallback<EditPointBehavior>(
    (key: PointKey, pointBehavior: Partial<Omit<PointBehavior, "key">>) => {
      trackEvent("breakpoint.edit");

      const { pointBehaviors } = committedValuesRef.current;
      const prevPointBehavior = pointBehaviors[key];

      setPointBehaviors(prev => ({
        ...prev,
        [key]: {
          shouldBreak: prevPointBehavior?.shouldBreak ?? POINT_BEHAVIOR_DISABLED,
          shouldLog: prevPointBehavior?.shouldLog ?? POINT_BEHAVIOR_DISABLED,
          ...pointBehavior,
          key,
        },
      }));
    },
    [committedValuesRef, setPointBehaviors, trackEvent]
  );
}
