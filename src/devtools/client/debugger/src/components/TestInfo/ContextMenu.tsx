import classNames from "classnames/bind";
import { useContext, useRef } from "react";

import useModalDismissSignal from "replay-next/src/hooks/useModalDismissSignal";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { useTestStepActions } from "ui/hooks/useTestStepActions";
import { AnnotatedTestStep, TestItem } from "ui/types";

import { Coordinates, TestInfoContextMenuContext } from "./TestInfoContextMenuContext";
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
  const ref = useRef<HTMLDivElement>(null);
  const classnames = classNames.bind(styles);
  const actions = useTestStepActions(testStep);

  const isFirstStep = test.steps?.[0].id === testStep.id;
  const isLastStep = test.steps?.[test.steps.length - 1].id === testStep.id;

  useModalDismissSignal(ref, hide, true);

  const onPlayFromHere = () => {
    hide();
    actions.playFromStep(test);
  };
  const onPlayToHere = () => {
    hide();
    actions.playToStep(test);
  };
  const onJumpToBefore = () => {
    if (actions.isAtStepStart) {
      return;
    }

    hide();
    actions.seekToStepStart();
  };
  const onJumpToAfter = () => {
    if (actions.isAtStepEnd) {
      return;
    }

    hide();
    actions.seekToStepEnd();
  };
  const onGoToLocation = async () => {
    hide();
    actions.showStepSource();
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
      <div className={styles.ContextMenuItem} onClick={onGoToLocation}>
        <MaterialIcon>code</MaterialIcon>
        Jump to source
      </div>
      <div
        className={classnames("ContextMenuItem", { disabled: isFirstStep })}
        onClick={onPlayToHere}
      >
        <MaterialIcon>play_circle</MaterialIcon>
        Play to here
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
          disabled: actions.isAtStepStart,
        })}
        onClick={onJumpToBefore}
      >
        <MaterialIcon>arrow_back</MaterialIcon>
        Show before
      </div>
      <div
        className={classnames("ContextMenuItem", {
          disabled: actions.isAtStepEnd,
        })}
        onClick={onJumpToAfter}
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
