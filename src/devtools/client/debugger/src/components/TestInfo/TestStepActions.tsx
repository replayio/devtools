import React from "react";

import { setViewMode } from "ui/actions/layout";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { getViewMode } from "ui/reducers/layout";
import { getPlayback } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

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
