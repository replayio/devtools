import { useCallback } from "react";

import { TrackEvent } from "replay-next/src/contexts/SessionContext";
import {
  POINT_BEHAVIOR_DISABLED,
  POINT_BEHAVIOR_DISABLED_TEMPORARILY,
  PointBehavior,
  PointKey,
} from "shared/client/types";

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
    (
      key: PointKey,
      pointBehavior: Partial<Omit<PointBehavior, "key">>,
      createdByCurrentUser: boolean
    ) => {
      trackEvent("breakpoint.edit");

      const { pointBehaviors } = committedValuesRef.current;
      const prevPointBehavior = pointBehaviors[key];

      // Shared points should never be fully disabled, because they would be hidden (but not deleted).
      // Make sure they're disabled temporarily instead so they remain visible in the left side bar.
      if (!createdByCurrentUser) {
        if (pointBehavior.shouldLog === POINT_BEHAVIOR_DISABLED) {
          pointBehavior.shouldLog = POINT_BEHAVIOR_DISABLED_TEMPORARILY;
        }
      }

      // Shared points should never be fully disabled, because they would be hidden (but not deleted).
      // Make sure they're disabled temporarily instead so they remain visible in the left side bar.
      const defaultBehavior = createdByCurrentUser
        ? POINT_BEHAVIOR_DISABLED
        : POINT_BEHAVIOR_DISABLED_TEMPORARILY;

      setPointBehaviors(prev => ({
        ...prev,
        [key]: {
          shouldLog: prevPointBehavior?.shouldLog ?? defaultBehavior,
          ...pointBehavior,
          key,
        },
      }));
    },
    [committedValuesRef, setPointBehaviors, trackEvent]
  );
}
