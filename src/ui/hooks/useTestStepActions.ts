import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getContext } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { AnnotatedTestStep, TestItem } from "shared/graphql/types";
import { getCurrentPoint } from "ui/actions/app";
import { setViewMode } from "ui/actions/layout";
import { seek, seekToTime, startPlayback } from "ui/actions/timeline";
import { setSourcesUserActionPending } from "ui/reducers/sources";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AwaitTimeout, awaitWithTimeout } from "ui/utils/awaitWithTimeout";

import { getTestStepSourceLocationAsync } from "../suspense/testStepCache";
import { isStepEnd, isStepStart } from "./useStepState";
import { useTestInfo } from "./useTestInfo";

const canPlayback = (
  test: TestItem
): test is TestItem & { relativeStartTime: number; duration: number } => {
  return test.relativeStartTime != null && test.duration != null;
};

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

  const playFromStep = useCallback(
    (test: TestItem) => {
      if (!testStep || !canPlayback(test)) {
        return;
      }

      dispatch(
        startPlayback({
          beginTime: testStep.absoluteStartTime,
          endTime: test.relativeStartTime + test.duration,
        })
      );
    },
    [dispatch, testStep]
  );

  const playToStep = useCallback(
    (test: TestItem) => {
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
    },
    [dispatch, testStep]
  );

  const seekToStepStart = useCallback(() => {
    if (!canJumpToBefore) {
      return;
    }

    const start = testStep.annotations.start;
    if (start) {
      dispatch(seek(start.point, start.time, false));
    } else {
      dispatch(seekToTime(testStep.absoluteStartTime));
    }
  }, [dispatch, testStep, canJumpToBefore]);

  const seekToStepEnd = useCallback(() => {
    if (!canJumpToAfter) {
      return;
    }

    const end = testStep.annotations.end;
    if (end) {
      dispatch(seek(end.point, end.time, false));
    } else {
      dispatch(seekToTime(testStep.absoluteEndTime - 1));
    }
  }, [dispatch, testStep, canJumpToAfter]);

  const showStepSource = useCallback(async () => {
    if (!canShowStepSource) {
      return;
    }

    dispatch(setViewMode("dev"));

    const locationPromise = getTestStepSourceLocationAsync(client, info.metadata, testStep);

    let location = await awaitWithTimeout(locationPromise);
    if (location === AwaitTimeout) {
      dispatch(setSourcesUserActionPending(true));
      location = await locationPromise;
    }

    if (location) {
      dispatch(selectLocation(cx, location));
    }

    dispatch(setSourcesUserActionPending(false));
  }, [dispatch, testStep, canShowStepSource, client, cx, info.metadata]);

  return useMemo(
    () => ({
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
    }),
    [
      canJumpToAfter,
      canJumpToBefore,
      stepEnd,
      stepStart,
      playFromStep,
      playToStep,
      seekToStepEnd,
      seekToStepStart,
      showStepSource,
      canShowStepSource,
    ]
  );
};
