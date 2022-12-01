import { useContext, useRef } from "react";

import useModalDismissSignal from "bvaughn-architecture-demo/src/hooks/useModalDismissSignal";
import { seekToTime, startPlayback } from "ui/actions/timeline";

import {
  Coordinates,
  TestCaseType,
  TestInfoContextMenuContext,
  TestStepType,
} from "./TestInfoContextMenuContext";
import styles from "./ContextMenu.module.css";
import { selectLocation } from "../../actions/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getContext } from "../../selectors";

function ContextMenu({
  hide,
  mouseCoordinates,
  testStep,
  testCase,
}: {
  hide: () => void;
  mouseCoordinates: Coordinates;
  testStep: TestStepType;
  testCase: TestCaseType;
}) {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const cx = useAppSelector(getContext);

  useModalDismissSignal(ref, hide, true);

  const onPlayFromHere = () => {
    hide();
    dispatch(startPlayback({ beginTime: testStep.startTime, endTime: testCase.endTime }));
    console.log("on play from here", { testStep, testCase });
  };
  const onJumpToBefore = () => {
    hide();
    dispatch(seekToTime(testStep.startTime));
  };
  const onJumpToAfter = () => {
    hide();
    dispatch(seekToTime(testStep.endTime - 1));
  };
  const onGoToLocation = async () => {
    if (!testStep.enqueuePoint) {
      return;
    }

    const frame = await (async point => {
      const {
        data: { frames },
      } = await client.createPause(point);

      const returnFirst = (list: any, fn: any) =>
        list.reduce((acc: any, v: any, i: any) => acc ?? fn(v, i, list), null);

      return returnFirst(frames, (f: any, i: any, l: any) =>
        l[i + 1]?.functionName === "__stackReplacementMarker" ? f : null
      );
    })(testStep.enqueuePoint);

    const location = frame.location[frame.location.length - 1];

    if (location) {
      dispatch(selectLocation(cx, location));
    }
  };

  return (
    <div
      className={styles.ContextMenu}
      data-test-id="ConsoleContextMenu"
      ref={ref}
      style={{
        left: mouseCoordinates.x,
        top: mouseCoordinates.y,
      }}
    >
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={onPlayFromHere}
      >
        Play from here
      </div>
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={onJumpToBefore}
      >
        Show before
      </div>
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={onJumpToAfter}
      >
        Show after
      </div>
      {/* <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={onClick}
      >
        Jump to source code
      </div> */}
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
        testCase={testCase}
      />
    );
  }
}
