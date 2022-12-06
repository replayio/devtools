import classNames from "classnames/bind";
import { useContext, useRef } from "react";

import useModalDismissSignal from "bvaughn-architecture-demo/src/hooks/useModalDismissSignal";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seek, seekToTime, startPlayback } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { AnnotatedTestStep, TestItem } from "ui/types";

import { selectLocation } from "../../actions/sources";
import { getContext } from "../../selectors";
import { Coordinates, TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
import { returnFirst } from "./TestStepItem";
import styles from "./ContextMenu.module.css";

function ContextMenu({
  hide,
  mouseCoordinates,
  testStep,
  test,
}: {
  hide: () => void;
  mouseCoordinates: Coordinates;
  testStep: AnnotatedTestStep;
  test: TestItem;
}) {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(getCurrentTime);
  const ref = useRef<HTMLDivElement>(null);
  const cx = useAppSelector(getContext);
  const client = useContext(ReplayClientContext);
  const classnames = classNames.bind(styles);

  const isLastStep = test.steps[test.steps.length - 1].id === testStep.id;
  const adjustedAbsoluteEndTime = testStep.absoluteEndTime - 1;

  useModalDismissSignal(ref, hide, true);

  const onPlayFromHere = () => {
    hide();
    dispatch(
      startPlayback({
        beginTime: testStep.absoluteStartTime,
        endTime: test.relativeStartTime + test.duration,
      })
    );
  };
  const onJumpToBefore = () => {
    hide();
    const start = testStep.annotations.start;
    if (start) {
      dispatch(seek(start.point, start.time, false));
    } else {
      dispatch(seekToTime(testStep.absoluteStartTime));
    }
  };
  const onJumpToAfter = () => {
    hide();
    const end = testStep.annotations.end;
    if (end) {
      dispatch(seek(end.point, end.time, false));
    } else {
      dispatch(seekToTime(adjustedAbsoluteEndTime));
    }
  };
  const onGoToLocation = async () => {
    hide();
    if (!testStep.annotations.enqueue) {
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

  const canJumpToBefore = adjustedAbsoluteEndTime === currentTime || testStep.name === "assert";

  return (
    <div
      className={styles.ContextMenu}
      ref={ref}
      style={{
        left: mouseCoordinates.x,
        top: mouseCoordinates.y,
      }}
    >
      <div className={styles.ContextMenuItem} onClick={onGoToLocation}>
        <MaterialIcon>code</MaterialIcon>
        Jump to source
      </div>
      <div
        className={classnames("ContextMenuItem", { disabled: isLastStep })}
        onClick={onPlayFromHere}
      >
        <MaterialIcon>play_circle</MaterialIcon>
        Play from here
      </div>
      <div
        className={classnames("ContextMenuItem", {
          disabled: canJumpToBefore,
        })}
        onClick={canJumpToBefore ? undefined : onJumpToBefore}
      >
        <MaterialIcon>arrow_back</MaterialIcon>
        Show before
      </div>
      <div
        className={classnames("ContextMenuItem", {
          disabled: adjustedAbsoluteEndTime === currentTime,
        })}
        onClick={adjustedAbsoluteEndTime === currentTime ? undefined : onJumpToAfter}
      >
        <MaterialIcon>arrow_forward</MaterialIcon>
        Show after
      </div>
    </div>
  );
}

export default function ContextMenuWrapper() {
  const { hide, mouseCoordinates, testStep, testCase } = useContext(TestInfoContextMenuContext);

  if (mouseCoordinates === null || testStep === null || testCase === null) {
    return null;
  } else {
    return (
      <ContextMenu
        hide={hide}
        mouseCoordinates={mouseCoordinates}
        testStep={testStep}
        test={testCase}
      />
    );
  }
}
