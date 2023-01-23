import { Frame, Location } from "@replayio/protocol";
import { useContext } from "react";
import semver from "semver";

import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getContext } from "devtools/client/debugger/src/selectors";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { getCurrentPoint } from "ui/actions/app";
import { seek, seekToTime, startPlayback } from "ui/actions/timeline";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep, TestItem } from "ui/types";

import { useGetRecording, useGetRecordingId } from "./recordings";
import { isStepEnd, isStepStart } from "./useStepState";

function findSourceLocationCypress8Plus(
  frames: Frame[],
  { isChaiAssertion = false }: { isChaiAssertion?: boolean }
) {
  // find the cypress marker frame
  const markerFrameIndex = frames.findIndex(
    (f: any, i: any, l: any) => f.functionName === "__stackReplacementMarker"
  );

  // and extract its sourceId
  const markerSourceId = frames[markerFrameIndex]?.functionLocation?.[0].sourceId;
  if (markerSourceId) {
    // slice the frames from the current to the marker frame and reverse
    // it so the user frames are on top
    const userFrames = frames?.slice(0, markerFrameIndex).reverse();

    const frame = userFrames.find((f, i, l) => {
      if (isChaiAssertion) {
        // if this is a chai assertion, the invocation was synchronous in this
        // call stack so we're looking from the top for the first frame that
        // isn't from the same source as the marker to identify the user frame
        // that invoke it
        return f.functionLocation?.every(fl => fl.sourceId !== markerSourceId);
      } else {
        // for enqueued assertions, search from the top for the first frame from the same source
        // as the marker (which should be cypress_runner.js) and return it
        return l[i + 1]?.functionLocation?.some(fl => fl.sourceId === markerSourceId);
      }
    });

    return frame?.location[frame.location.length - 1];
  }
}

function findSourceLocationCypress8Below(frames: Frame[]) {
  // find the cypress marker frame
  const markerFrameIndex = frames.findIndex((f: any, i: any, l: any) =>
    f.functionName?.startsWith("injectHtmlAndBootAlpine")
  );

  // the user frame should be right before injectHtmlAndBootAlpine
  const frame = frames[markerFrameIndex - 1];

  return frame?.location[frame.location.length - 1];
}

export const useTestStepActions = (testStep: AnnotatedTestStep | null) => {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const currentPoint = useAppSelector(getCurrentPoint);
  const cx = useAppSelector(getContext);
  const client = useContext(ReplayClientContext);
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const cypressVersion =
    recording?.metadata?.test?.runner?.name === "cypress"
      ? recording.metadata.test.runner.version
      : undefined;

  const stepStart = testStep ? isStepStart(testStep, currentTime, currentPoint) : false;
  const canJumpToBefore = testStep && !stepStart && testStep.name !== "assert";

  const stepEnd = testStep ? isStepEnd(testStep, currentTime, currentPoint) : false;
  const canJumpToAfter = testStep && !stepEnd && testStep.name !== "assert";

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
    const isChaiAssertion = testStep?.name === "assert" && !testStep.annotations.enqueue;
    const annotation = isChaiAssertion ? testStep.annotations.start : testStep?.annotations.enqueue;

    if (!annotation || !cypressVersion) {
      return;
    }

    const point = annotation.point;

    const {
      data: { frames },
    } = await client.createPause(point);

    if (frames) {
      let location: Location | undefined;
      if (semver.gte(cypressVersion, "8.0.0")) {
        location = findSourceLocationCypress8Plus(frames, {
          isChaiAssertion,
        });
      } else {
        location = findSourceLocationCypress8Below(frames);
      }

      if (location) {
        dispatch(selectLocation(cx, location));
      }
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
    canShowStepSource: !!cypressVersion,
  };
};
