import { useContext, useRef } from "react";

import useModalDismissSignal from "bvaughn-architecture-demo/src/hooks/useModalDismissSignal";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { seekToTime, startPlayback } from "ui/actions/timeline";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { selectLocation } from "../../actions/sources";
import { getContext } from "../../selectors";
import {
  Coordinates,
  TestCaseType,
  TestInfoContextMenuContext,
  TestStepType,
} from "./TestInfoContextMenuContext";
import styles from "./ContextMenu.module.css";

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
  const client = useContext(ReplayClientContext);

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
    hide();
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
      ref={ref}
      style={{
        left: mouseCoordinates.x,
        top: mouseCoordinates.y,
      }}
    >
      <div className={styles.ContextMenuItem} onClick={onPlayFromHere}>
        <MaterialIcon>play_circle</MaterialIcon>
        Play from here
      </div>
      <div className={styles.ContextMenuItem} onClick={onJumpToBefore}>
        <MaterialIcon>arrow_back</MaterialIcon>
        Show before
      </div>
      <div className={styles.ContextMenuItem} onClick={onJumpToAfter}>
        <MaterialIcon>arrow_forward</MaterialIcon>
        Show after
      </div>
      <div className={styles.ContextMenuItem} onClick={onGoToLocation}>
        <MaterialIcon>code</MaterialIcon>
        Show source code
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
        testCase={testCase}
      />
    );
  }
}
