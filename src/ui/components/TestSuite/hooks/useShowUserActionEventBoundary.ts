import { useContext } from "react";

import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { UserActionEvent } from "shared/test-suites/types";
import { seek } from "ui/actions/timeline";
import { useAppDispatch } from "ui/setup/hooks";

export function useShowUserActionEventBoundary({
  boundary,
  userActionEvent,
}: {
  boundary: "before" | "after";
  userActionEvent: UserActionEvent;
}) {
  const { executionPoint: currentPoint } = useContext(TimelineContext);

  const dispatch = useAppDispatch();

  const timeSTampedPoint =
    boundary === "before"
      ? userActionEvent.timeStampedPointRange.begin
      : userActionEvent.timeStampedPointRange.end;

  const disabled = timeSTampedPoint.point === currentPoint;

  const onClick = () => {
    dispatch(seek(timeSTampedPoint.point, timeSTampedPoint.time, false));
  };

  return { disabled, onClick };
}
