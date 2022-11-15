import React from "react";

import { seekToTime, setTimelineToTime, startPlayback } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getCurrentTime } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

export function TestSteps({ test, startTime }: { test: TestItem; startTime: number }) {
  const { steps } = test;
  const dispatch = useAppDispatch();
  const testStart = test.steps[0].relativeStartTime + startTime;
  const testEnd =
    test.steps[test.steps.length - 1].relativeStartTime +
    startTime +
    test.steps[test.steps.length - 1].duration;

  const onReplay = () => {
    dispatch(startPlayback({ beginTime: testStart, endTime: testEnd }));
  };
  const onPlayFromHere = (beginTime: number) => {
    dispatch(startPlayback({ beginTime: startTime, endTime: testEnd }));
  };

  return (
    <div className="flex flex-col rounded-lg py-2 pl-11">
      {steps?.map((s, i) => (
        <TestStepItem
          testName={s.name}
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

function TestStepItem({
  testName,
  startTime,
  duration,
  argString,
  index,
  parentId,
  error,
  onReplay,
  onPlayFromHere,
  isLastStep,
}: {
  testName: string;
  startTime: number;
  duration: number;
  argString: string;
  index: number;
  parentId?: string;
  error: boolean;
  onReplay: () => void;
  onPlayFromHere: () => void;
  isLastStep: boolean;
}) {
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  // some chainers (`then`) don't have a duration, so let's bump it here so that it shows something in the UI
  const isPast = currentTime > startTime;
  const isPaused = currentTime >= startTime && currentTime < startTime + (duration || 1);

  const onClick = () => dispatch(seekToTime(startTime));
  const onMouseEnter = () => dispatch(setTimelineToTime(startTime));
  const onMouseLeave = () => dispatch(setTimelineToTime(currentTime));

  const pausedColor = error ? "border-l-red-500" : "border-l-green-500";

  return (
    <div
      className={`group/step relative flex items-center overflow-hidden border-b border-l-4 border-themeBase-90 bg-testsuitesStepsBgcolor pl-1 pr-3 font-mono ${
        isPast || isPaused ? pausedColor : "border-l-transparent"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={onClick}
        className="flex flex-grow items-center space-x-2 overflow-hidden py-2 text-start"
      >
        <div className="opacity-70">{index + 1}</div>
        <div className={`whitespace-pre font-medium text-bodyColor ${isPaused ? "font-bold" : ""}`}>
          {parentId ? "- " : ""}
          {testName}
        </div>
        <div className="opacity-70">{argString}</div>
      </button>
      <TestStepAction
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        isLastStep={isLastStep}
        isPaused={isPaused}
      />
    </div>
  );
}

function TestStepAction({
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
      <button className={classname} onClick={onReplay} title="Replay this test">
        <MaterialIcon>replay</MaterialIcon>
      </button>
    );
  }

  return (
    <button className={classname} onClick={onPlayFromHere} title="Play test from here">
      <MaterialIcon>play_arrow</MaterialIcon>
    </button>
  );
}
