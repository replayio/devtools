import { useContext } from "react";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { returnFirst } from "devtools/client/debugger/src/components/TestInfo/TestStepItem";
import { getContext } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getCurrentPoint } from "ui/actions/app";
import { seek, seekToTime, startPlayback } from "ui/actions/timeline";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep, TestItem } from "ui/types";

export const useTestStepActions = (testStep: AnnotatedTestStep | null) => {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const currentPoint = useAppSelector(getCurrentPoint);
  const cx = useAppSelector(getContext);
  const client = useContext(ReplayClientContext);

  const isAtStepStart =
    currentPoint && testStep?.annotations.start
      ? BigInt(currentPoint) === BigInt(testStep.annotations.start.point)
      : !!testStep && currentTime === testStep.absoluteStartTime;
  const canJumpToBefore = !isAtStepStart;

  const isAtStepEnd =
    currentPoint && testStep?.annotations.end
      ? BigInt(currentPoint) === BigInt(testStep.annotations.end.point)
      : !!testStep && currentTime === testStep.absoluteEndTime;
  const canJumpToAfter = !isAtStepEnd;

  const playFromStep = (test: TestItem) => {
    if (!testStep) {
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
    if (!testStep) {
      return;
    }
    dispatch(
      startPlayback({
        beginTime: test.relativeStartTime,
        endTime: testStep.absoluteStartTime,
      })
    );
  };

  const seekToStepStart = () => {
    if (!canJumpToBefore || !testStep) {
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
    if (!canJumpToAfter || !testStep) {
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
    if (!testStep?.annotations.enqueue) {
      return;
    }

    const point = testStep.annotations.enqueue.point;

    const {
      data: { frames },
    } = await client.createPause(point);

    if (frames) {
      // find the cypress marker frame
      const markerFrameIndex = returnFirst(frames, (f: any, i: any, l: any) =>
        f.functionName === "__stackReplacementMarker" ? i : null
      );

      // and extract its sourceId
      const markerSourceId = frames[markerFrameIndex]?.functionLocation?.[0].sourceId;
      if (markerSourceId) {
        // slice the frames from the current to the marker frame and reverse
        // it so the user frames are on top
        const userFrames = frames?.slice(0, markerFrameIndex).reverse();

        // then search from the top for the first frame from the same source
        // as the marker (which should be cypress_runner.js) and return it
        const frame = returnFirst(userFrames, (f, i, l) => {
          return l[i + 1]?.functionLocation?.some(fl => fl.sourceId === markerSourceId) ? f : null;
        });

        const location = frame?.location[frame.location.length - 1];

        if (location) {
          dispatch(selectLocation(cx, location));
        }
      }
    }
  };

  return {
    isAtStepEnd,
    isAtStepStart,
    playFromStep,
    playToStep,
    seekToStepEnd,
    seekToStepStart,
    showStepSource,
  };
};
