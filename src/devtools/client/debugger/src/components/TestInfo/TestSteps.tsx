import { Location } from "@replayio/protocol";
import React from "react";

import { setViewMode } from "ui/actions/layout";
import { seekToTime, setTimelineToTime, startPlayback } from "ui/actions/timeline";
import Icon from "ui/components/shared/Icon";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getViewMode } from "ui/reducers/layout";
import { getCurrentTime, getPlayback } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import { selectLocation } from "../../actions/sources";
import { getThreadContext } from "../../selectors";
import { ProgressBar } from "./ProgressBar";

export function TestSteps({
  test,
  startTime,
  location,
}: {
  test: TestItem;
  startTime: number;
  location?: Location;
}) {
  const cx = useAppSelector(getThreadContext);
  const dispatch = useAppDispatch();
  const testStart = test.steps[0].relativeStartTime + startTime;
  const testEnd =
    test.steps[test.steps.length - 1].relativeStartTime +
    startTime +
    test.steps[test.steps.length - 1].duration;

  const onReplay = () => {
    dispatch(startPlayback({ beginTime: testStart, endTime: testEnd - 1 }));
  };
  const onPlayFromHere = (beginTime: number) => {
    dispatch(startPlayback({ beginTime: startTime, endTime: testEnd - 1 }));
  };
  const onGoToLocation = () => {
    if (location) {
      dispatch(selectLocation(cx, location));
    }
  };

  return (
    <div className="flex flex-col rounded-lg py-2 pl-11">
      {test.steps?.map((s, i) => (
        <TestStepItem
          testName={s.name}
          key={i}
          index={i}
          startTime={startTime + s.relativeStartTime}
          duration={s.duration}
          argString={s.args?.toString()}
          parentId={s.parentId}
          error={!!s.error}
          isLastStep={test.steps.length - 1 === i}
          onReplay={onReplay}
          onPlayFromHere={() => onPlayFromHere(startTime + s.relativeStartTime)}
          onGoToLocation={onGoToLocation}
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
  isLastStep,
  onReplay,
  onPlayFromHere,
  onGoToLocation,
}: {
  testName: string;
  startTime: number;
  duration: number;
  argString: string;
  index: number;
  parentId?: string;
  error: boolean;
  isLastStep: boolean;
  onReplay: () => void;
  onPlayFromHere: () => void;
  onGoToLocation: () => void;
}) {
  const currentTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
  const isPast = currentTime > startTime;
  // some chainers (`then`) don't have a duration, so let's bump it here (+1) so that it shows something in the UI
  const adjustedDuration = duration || 1;
  const isPaused = currentTime >= startTime && currentTime < startTime + adjustedDuration;

  const onClick = () => dispatch(seekToTime(startTime));
  const onMouseEnter = () => dispatch(setTimelineToTime(startTime));
  const onMouseLeave = () => dispatch(setTimelineToTime(currentTime));
  const onJumpToBefore = () => dispatch(seekToTime(startTime));
  const onJumpToAfter = () => {
    dispatch(seekToTime(startTime + adjustedDuration - 1));
  };

  // This math is bananas don't look here until this is cleaned up :)
  const bump = isPaused || isPast ? 10 : 0;
  const actualProgress = bump + 90 * ((currentTime - startTime) / adjustedDuration);
  const progress = actualProgress > 100 ? 100 : actualProgress;
  const displayedProgress = adjustedDuration === 1 && isPaused ? 100 : progress;

  return (
    <div
      className={`group/step relative flex items-start gap-1 overflow-hidden border-b border-themeBase-90 bg-testsuitesStepsBgcolor pl-1 pr-3 font-mono`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={onClick}
        className="flex flex-grow items-start space-x-2 overflow-hidden py-2 text-start"
      >
        <div title={"" + displayedProgress}>
          <ProgressBar progress={displayedProgress} />
        </div>
        <div className="opacity-70">{index + 1}</div>
        <div className={`whitespace-pre font-medium text-bodyColor ${isPaused ? "font-bold" : ""}`}>
          {parentId ? "- " : ""}
          {testName}
        </div>
        <div className="opacity-70">{argString}</div>
      </button>
      <TestStepActions
        onReplay={onReplay}
        onPlayFromHere={onPlayFromHere}
        isLastStep={isLastStep}
        isPaused={isPaused}
        onGoToLocation={onGoToLocation}
        onJumpToBefore={onJumpToBefore}
        onJumpToAfter={onJumpToAfter}
        duration={adjustedDuration}
      />
    </div>
  );
}

function TestStepActions({
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
        className={`flex flex-row items-center hover:bg-menuHoverBgcolor ${
          isPaused ? "visible" : "invisible"
        }`}
        onClick={onJumpToBefore}
      >
        <MaterialIcon>arrow_backward</MaterialIcon>
      </button>
      <button
        title="Jump to After"
        className={`flex flex-row items-center hover:bg-menuHoverBgcolor ${
          isPaused ? "visible" : "invisible"
        }`}
        onClick={onJumpToAfter}
      >
        <MaterialIcon>arrow_forward</MaterialIcon>
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
