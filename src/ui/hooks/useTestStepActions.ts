import { useContext, useEffect, useState } from "react";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getContext } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getCurrentPoint } from "ui/actions/app";
import { seek, seekToTime, startPlayback } from "ui/actions/timeline";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep, TestItem } from "ui/types";

import { getTestStepSourceLocationAsync } from "../suspense/testStepCache";
import { isStepEnd, isStepStart } from "./useStepState";
import { useTestInfo } from "./useTestInfo";

export const useTestStepActions = (testStep: AnnotatedTestStep | null) => {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const currentPoint = useAppSelector(getCurrentPoint);
  const cx = useAppSelector(getContext);
  const client = useContext(ReplayClientContext);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const info = useTestInfo();

  useEffect(() => {
    client.waitForLoadedSources().then(() => setSourcesLoading(false));
  }, [client]);

  const cypressVersion = info.runner === "cypress" ? info.runnerVersion : undefined;

  const stepStart = testStep ? isStepStart(testStep, currentTime, currentPoint) : false;
  const canJumpToBefore = testStep && !stepStart && testStep.name !== "assert";

  const stepEnd = testStep ? isStepEnd(testStep, currentTime, currentPoint) : false;
  const canJumpToAfter = testStep && !stepEnd && testStep.name !== "assert";

  const isChaiAssertion = testStep?.name === "assert" && !testStep.annotations.enqueue;
  const annotation = isChaiAssertion ? testStep.annotations.start : testStep?.annotations.enqueue;
  const canShowStepSource = !!cypressVersion && !sourcesLoading && annotation;

  const canPlayback = (
    test: TestItem
  ): test is TestItem & { relativeStartTime: number; duration: number } => {
    return test.relativeStartTime != null && test.duration != null;
  };

  const playFromStep = (test: TestItem) => {
    if (!testStep || !canPlayback(test)) {
      return;
    }

    dispatch(
      startPlayback({
        beginTime: testStep.absoluteStartTime,
        endTime: test.relativeStartTime + test.duration,
      })
    );
  };

  const playToStep = (test: TestItem) => {
    if (!testStep || !canPlayback(test)) {
      return;
    }
    dispatch(
      startPlayback({
        beginTime: test.relativeStartTime || 0,
        endTime: testStep.annotations.end?.time || testStep.absoluteEndTime,
        endPoint: testStep.annotations.end?.point,
      })
    );
  };

  const seekToStepStart = () => {
    if (!canJumpToBefore) {
      return;
    }

    const start = testStep.annotations.start;
    if (start) {
      dispatch(seek(start.point, start.time, false));
    } else {
      dispatch(seekToTime(testStep.absoluteStartTime));
    }
  };

  const seekToStepEnd = () => {
    if (!canJumpToAfter) {
      return;
    }

    const end = testStep.annotations.end;
    if (end) {
      dispatch(seek(end.point, end.time, false));
    } else {
      dispatch(seekToTime(testStep.absoluteEndTime - 1));
    }
  };

  const showStepSource = async () => {
    if (!canShowStepSource) {
      return;
    }

    const location = await getTestStepSourceLocationAsync(client, info.metadata, testStep);

    if (location) {
      dispatch(selectLocation(cx, location));
    }
  };

  return {
    canPlayback,
    canJumpToAfter,
    canJumpToBefore,
    isAtStepEnd: stepEnd,
    isAtStepStart: stepStart,
    playFromStep,
    playToStep,
    seekToStepEnd,
    seekToStepStart,
    showStepSource,
    canShowStepSource,
  };
};
