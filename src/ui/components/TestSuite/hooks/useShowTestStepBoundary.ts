import { useContext } from "react";

import { assert } from "protocol/utils";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { seek, seekToTime } from "ui/actions/timeline";
import { ProcessedTestStep } from "ui/components/TestSuite/types";
import { useAppDispatch } from "ui/setup/hooks";

export function useShowTestStepBoundary({
  boundary,
  testStep,
}: {
  boundary: "before" | "after";
  testStep: ProcessedTestStep;
}) {
  const { executionPoint: currentPoint, time: currentTime } = useContext(TimelineContext);

  const dispatch = useAppDispatch();

  const range = testStep.type === "step" ? testStep.metadata.range : null;

  let disabled = range === null;
  if (range !== null) {
    const rangePoint = boundary === "before" ? range.beginPoint : range.endPoint;
    const rangeTime = boundary === "before" ? range.beginTime : range.endTime;

    disabled = rangePoint === currentPoint || (rangePoint === null && rangeTime === currentTime);
  }

  const onClick = () => {
    assert(testStep.type === "step");

    const { absoluteEndTime, annotations } = testStep.data;

    const annotation = boundary === "before" ? annotations.start : annotations.end;
    if (annotation) {
      dispatch(seek(annotation.point, annotation.time, false));
    } else {
      dispatch(seekToTime(absoluteEndTime - 1));
    }
  };

  return { disabled, onClick };
}
