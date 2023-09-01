import { useContext } from "react";

import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { UserActionEvent } from "shared/test-suites/RecordingTestMetadata";
import { seek } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";

export function useShowUserActionEventBoundary({
  boundary,
  userActionEvent,
}: {
  boundary: "before" | "after";
  userActionEvent: UserActionEvent;
}) {
  const {
    data: {
      timeStampedPoints: { afterStep, beforeStep },
    },
  } = userActionEvent;
  const { executionPoint: currentPoint } = useContext(TimelineContext);

  const dispatch = useAppDispatch();

  if (afterStep == null || beforeStep == null) {
    return {
      disabled: true,
      onClick: () => {},
    };
  }

  const timeStampedPoint = boundary === "before" ? beforeStep : afterStep;

  const disabled = timeStampedPoint.point === currentPoint;

  const onClick = () => {
    dispatch(
      seek({
        executionPoint: timeStampedPoint.point,
        openSource: false,
        time: timeStampedPoint.time,
      })
    );
  };

  return { disabled, onClick };
}
