import React from "react";

import { setViewMode } from "ui/actions/layout";
import { startPlayback } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getViewMode } from "ui/reducers/layout";
import {
  getReporterAnnotationsForTitle,
  getReporterAnnotationsForTitleEnd,
} from "ui/reducers/reporter";
import { getPlayback } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem, TestStep } from "ui/types";

import { TestStepItem } from "./TestStepItem";

function TestSection({
  steps,
  startTime,
  header,
  testTitle,
  onPlayFromHere,
  onReplay,
}: {
  onPlayFromHere: (time: number) => void;
  onReplay: () => void;
  startTime: number;
  steps: TestStep[];
  testTitle: string;
  header?: string;
}) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <>
      {header ? <div className="py-2">{header}</div> : null}
      {steps.map((s, i) => (
        <TestStepItem
          stepName={s.name}
          messageEnqueue={s.messageEnqueue}
          messageEnd={s.messageEnd}
          point={s.point}
          pointEnd={s.pointEnd}
          testTitle={testTitle}
          key={i}
          index={i}
          startTime={startTime + s.relativeStartTime}
          duration={s.duration}
          argString={s.args?.toString()}
          parentId={s.parentId}
          error={!!s.error}
          isLastStep={steps.length - 1 === i}
          onReplay={onReplay}
          onPlayFromHere={() => onPlayFromHere(startTime + s.relativeStartTime)}
        />
      ))}
    </>
  );
}

export function TestSteps({ test, startTime }: { test: TestItem; startTime: number }) {
  const dispatch = useAppDispatch();
  const annotations = useAppSelector(getReporterAnnotationsForTitle(test.title));
  const annotationsEnd = useAppSelector(getReporterAnnotationsForTitleEnd(test.title));
  const testStart = test.steps[0].relativeStartTime + startTime;
  const testEnd =
    test.steps[test.steps.length - 1].relativeStartTime +
    startTime +
    test.steps[test.steps.length - 1].duration;

  const onReplay = () => {
    dispatch(startPlayback({ beginTime: testStart, endTime: testEnd - 1 }));
  };
  const onPlayFromHere = (beginTime: number) => {
    dispatch(startPlayback({ beginTime, endTime: testEnd - 1 }));
  };

  console.log({ annotations, annotationsEnd });

  const [beforeEachSteps, testBodySteps, afterEachSteps] = (test.steps || []).reduce<TestStep[][]>(
    (acc, step, i) => {
      switch (step.hook) {
        case "beforeEach":
          acc[0].push({
            ...step,
            point: annotations[i].point,
            pointEnd: annotationsEnd[i].point,
            messageEnqueue: annotations[i].message,
            messageEnd: annotationsEnd[i].message,
          });
          break;
        case "afterEach":
          acc[2].push({
            ...step,
            point: annotations[i].point,
            pointEnd: annotationsEnd[i].point,
            messageEnqueue: annotations[i].message,
            messageEnd: annotationsEnd[i].message,
          });
          break;
        default:
          acc[1].push({
            ...step,
            point: annotations[i].point,
            pointEnd: annotationsEnd[i].point,
            messageEnqueue: annotations[i].message,
            messageEnd: annotationsEnd[i].message,
          });
          break;
      }

      return acc;
    },
    [[], [], []]
  );

  return (
    <div className="flex flex-col rounded-lg py-2 pl-11">
      <TestSection
        testTitle={test.title}
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        steps={beforeEachSteps}
        startTime={startTime}
        header="Before Each"
      />
      <TestSection
        testTitle={test.title}
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        steps={testBodySteps}
        startTime={startTime}
        header={beforeEachSteps.length + afterEachSteps.length > 0 ? "Test Body" : undefined}
      />
      <TestSection
        testTitle={test.title}
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        steps={afterEachSteps}
        startTime={startTime}
        header="After Each"
      />
      {test.error ? (
        <div className="border-l-2 border-red-500 bg-testsuitesErrorBgcolor text-testsuitesErrorColor">
          <div className="flex flex-row items-center space-x-1 p-2">
            <Icon filename="warning" size="small" className="bg-testsuitesErrorColor" />
            <div className="font-bold">Error</div>
          </div>
          <div className="wrap space-y-1 overflow-hidden bg-testsuitesErrorBgcolor p-2 font-mono">
            {test.error.message}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TestStepActions({
  onReplay,
  onPlayFromHere,
  isPaused,
  isLastStep,
  onGoToLocation,
  onJumpToBefore,
  onJumpToAfter,
  duration,
}: {
  isLastStep: boolean;
  isPaused: boolean;
  duration: number;
  onReplay: () => void;
  onPlayFromHere: () => void;
  onGoToLocation: () => void;
  onJumpToBefore: () => void;
  onJumpToAfter: () => void;
}) {
  const playback = useAppSelector(getPlayback);

  // Don't show actions when playing actions back
  if (playback) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 py-2">
      {duration !== 1 ? (
        <BeforeAndAfterButton
          isPaused={isPaused}
          onJumpToAfter={onJumpToAfter}
          onJumpToBefore={onJumpToBefore}
        />
      ) : null}
      <ToggleViewButton isPaused={isPaused} onGoToLocation={onGoToLocation} />
      <PlayButton
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        isLastStep={isLastStep}
        isPaused={isPaused}
      />
    </div>
  );
}
function BeforeAndAfterButton({
  isPaused,
  onJumpToBefore,
  onJumpToAfter,
}: {
  isPaused: boolean;
  onJumpToBefore: () => void;
  onJumpToAfter: () => void;
}) {
  return (
    <>
      <button
        title="Jump to Before"
        className={`flex rotate-180 transform flex-row items-center hover:bg-menuHoverBgcolor ${
          isPaused ? "visible" : "invisible"
        }`}
        onClick={onJumpToBefore}
      >
        <MaterialIcon>keyboard_tab</MaterialIcon>
      </button>
      <button
        title="Jump to After"
        className={`flex flex-row items-center hover:bg-menuHoverBgcolor ${
          isPaused ? "visible" : "invisible"
        }`}
        onClick={onJumpToAfter}
      >
        <MaterialIcon>keyboard_tab</MaterialIcon>
      </button>
    </>
  );
}
function ToggleViewButton({
  isPaused,
  onGoToLocation,
}: {
  isPaused: boolean;
  onGoToLocation: () => void;
}) {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(getViewMode);

  const onClick = () => {
    if (viewMode === "dev") {
      dispatch(setViewMode("non-dev"));
    } else {
      onGoToLocation();
    }
  };

  return (
    <button
      title={viewMode === "dev" ? "Expand the video" : "Show source in devtools"}
      className={`flex flex-row items-center hover:bg-menuHoverBgcolor ${
        isPaused ? "visible" : "invisible"
      }`}
      onClick={onClick}
    >
      <MaterialIcon>{viewMode === "dev" ? "fullscreen" : "code"}</MaterialIcon>
    </button>
  );
}
function PlayButton({
  onReplay,
  onPlayFromHere,
  isPaused,
  isLastStep,
}: {
  isLastStep: boolean;
  isPaused: boolean;
  onReplay: () => void;
  onPlayFromHere: () => void;
}) {
  // Only show the action by default if we're paused there
  const classname = `${isPaused ? "visible" : "invisible"} group-hover/step:visible`;

  if (isLastStep) {
    return (
      <button
        className={`flex flex-row items-center hover:bg-menuHoverBgcolor ${classname}`}
        onClick={onReplay}
        title="Replay this test"
      >
        <MaterialIcon>replay</MaterialIcon>
      </button>
    );
  }

  return (
    <button
      className={`flex flex-row items-center hover:bg-menuHoverBgcolor ${classname}`}
      onClick={onPlayFromHere}
      title="Play test from here"
    >
      <MaterialIcon>play_arrow</MaterialIcon>
    </button>
  );
}
