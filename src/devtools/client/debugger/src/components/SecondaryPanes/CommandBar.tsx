/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { Suspense, useContext, useDeferredValue, useEffect } from "react";

import actions from "devtools/client/debugger/src/actions/index";
import CommandBarButton from "devtools/client/debugger/src/components/shared/Button/CommandBarButton";
import { getSelectedFrameId, getThreadContext } from "devtools/client/debugger/src/reducers/pause";
import { formatKeyShortcut } from "devtools/client/debugger/src/utils/text";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import Services from "devtools/shared/services";
import { framesCache } from "replay-next/src/suspense/FrameCache";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import Loader from "ui/components/shared/Loader";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

const { appinfo } = Services;

const isMacOS = appinfo.OS === "Darwin";

// NOTE: the "resume" command will call either the resume
// depending on whether or not the debugger is paused or running
const COMMANDS = ["resume", "reverseStepOver", "stepOver", "stepIn", "stepOut"] as const;
type PossibleCommands = typeof COMMANDS[number];

const KEYS = {
  WINNT: {
    resume: "F8",
    reverseStepOver: "Shift+F10",
    stepOver: "F10",
    stepIn: "F11",
    stepOut: "Shift+F11",
  },
  Darwin: {
    resume: "Cmd+\\",
    reverseStepOver: "Cmd+Shift+'",
    stepOver: "Cmd+'",
    stepIn: "Cmd+;",
    stepOut: "Cmd+Shift+;",
  },
  Linux: {
    resume: "F8",
    reverseStepOver: "Shift+F10",
    stepOver: "F10",
    stepIn: "F11",
    stepOut: "Shift+F11",
  },
};

function getKey(action: string) {
  // @ts-expect-error could be 'Unknown', whatever
  return getKeyForOS(appinfo.OS, action);
}

function getKeyForOS(os: keyof typeof KEYS, action: string): string {
  const osActions = KEYS[os] || KEYS.Linux;
  // @ts-expect-error whatever
  return osActions[action];
}

function formatKey(action: string) {
  const key = getKey(`${action}Display`) || getKey(action);
  if (isMacOS) {
    const winKey = getKeyForOS("WINNT", `${action}Display`) || getKeyForOS("WINNT", action);
    // display both Windows type and Mac specific keys
    return formatKeyShortcut([key, winKey].join(" "));
  }
  return formatKeyShortcut(key);
}

function useFramesAndFrameSteps() {
  const replayClient = useContext(ReplayClientContext);
  const { frameId: selectedFrameId, pauseId: selectedPauseId } =
    useAppSelector(getSelectedFrameId) ?? {};

  // This hook fetches Frames and frame-steps using Suspense.
  // Each time the current Pause ID or Frame ID changes,
  // the component will "suspend" to fetch new frame data.
  // Components should avoid suspending during a high priority update though,
  // because React will show the component's fallback UI until the data is ready
  // (and this can be pretty jarring).
  // The useDeferredValue() hook is used to avoid suspending during a high priority update.
  // If the Pause ID or Frame ID changes during a high-priority update,
  // useDeferredValue() will return the previous value instead
  // allowing this component to avoid suspending during that update.
  // It will then schedule a lower priority "transition" update with the new value,
  // which React will run in the background (without committing or showing the fallback UI)
  // until the new frame data has been loaded.
  const deferredFrameId = useDeferredValue(selectedFrameId);
  const deferredPauseId = useDeferredValue(selectedPauseId);

  const frames = deferredPauseId ? framesCache.read(replayClient, deferredPauseId) : undefined;
  const frameSteps =
    deferredFrameId && deferredPauseId
      ? frameStepsCache.read(replayClient, deferredPauseId, deferredFrameId)
      : undefined;

  return { frames, frameSteps };
}

export default function CommandBar() {
  return (
    <Suspense fallback={<Loader />}>
      <CommandBarSuspends />
    </Suspense>
  );
}

function CommandBarSuspends() {
  const cx = useAppSelector(getThreadContext);

  const { frames, frameSteps } = useFramesAndFrameSteps();

  const dispatch = useAppDispatch();

  useEffect(() => {
    const shortcuts = new KeyShortcuts({
      window,
      target: document.body,
    });

    function handleEvent(e: KeyboardEvent, action: PossibleCommands) {
      e.preventDefault();
      e.stopPropagation();
      dispatch(actions[action](cx));
    }

    COMMANDS.forEach(action =>
      shortcuts.on(getKey(action), (e: KeyboardEvent) => handleEvent(e, action))
    );

    if (isMacOS) {
      // The Mac supports both the Windows Function keys
      // as well as the Mac non-Function keys
      COMMANDS.forEach(action =>
        shortcuts.on(getKeyForOS("WINNT", action), (e: KeyboardEvent) => handleEvent(e, action))
      );
    }

    return () => {
      COMMANDS.forEach(action => shortcuts!.off(getKey(action)));
      if (isMacOS) {
        COMMANDS.forEach(action => shortcuts!.off(getKeyForOS("WINNT", action)));
      }
    };
  }, [cx, dispatch]);

  const hasFramePositions = frameSteps && frameSteps.length > 0;
  const isPaused = frames && frames.length > 0;
  const disabled = !isPaused || !hasFramePositions;
  const disabledTooltip = !isPaused
    ? "Stepping is disabled until you're paused at a point"
    : "Stepping is disabled because there are too many steps in the current frame";

  function onRewind() {
    trackEvent("debugger.rewind");
    dispatch(actions.rewind(cx));
  }
  function onResume() {
    trackEvent("debugger.resume");
    dispatch(actions.resume(cx));
  }
  function onReverseStepOver() {
    trackEvent("debugger.reverse_step_over");
    dispatch(actions.reverseStepOver(cx));
  }
  function onStepOver() {
    trackEvent("debugger.step_over");
    dispatch(actions.stepOver(cx));
  }
  function onStepIn() {
    trackEvent("debugger.step_in");
    dispatch(actions.stepIn(cx));
  }
  function onStepOut() {
    trackEvent("debugger.step_out");
    dispatch(actions.stepOut(cx));
  }

  return (
    <div className="command-bar">
      <CommandBarButton key="rewind" onClick={onRewind} tooltip="Rewind Execution" type="rewind" />
      <CommandBarButton
        key="resume"
        onClick={onResume}
        tooltip={`Resume ${formatKey("resume")}`}
        type="resume"
      />
      <div key="divider-2" className="divider" />
      <CommandBarButton
        disabled={disabled}
        key="reverseStepOver"
        onClick={onReverseStepOver}
        tooltip="Reverse Step Over"
        disabledTooltip={disabledTooltip}
        type="reverseStepOver"
      />
      <CommandBarButton
        disabled={disabled}
        key="stepOver"
        onClick={onStepOver}
        tooltip="Step Over"
        disabledTooltip={disabledTooltip}
        type="stepOver"
      />
      <div key="divider-3" className="divider" />
      <CommandBarButton
        disabled={disabled}
        key="stepIn"
        onClick={onStepIn}
        tooltip="Step In"
        disabledTooltip={disabledTooltip}
        type="stepIn"
      />
      <CommandBarButton
        disabled={disabled}
        key="stepOut"
        onClick={onStepOut}
        tooltip="Step Out"
        disabledTooltip={disabledTooltip}
        type="stepOut"
      />
    </div>
  );
}
