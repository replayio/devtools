import { PauseId } from "@replayio/protocol";
import { Suspense, useMemo } from "react";

import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import {
  Context,
  PauseFrame,
  getFrameworkGroupingState,
  getPauseId,
  getSelectedFrameId,
  getThreadContext,
} from "devtools/client/debugger/src/selectors";
import { Pause } from "protocol/thread/pause";
import { ThreadFront } from "protocol/thread/thread";
import { assert } from "protocol/utils";
import { enterFocusMode as enterFocusModeAction } from "ui/actions/timeline";
import { getLoadedRegions } from "ui/reducers/app";
import { getSourcesLoading } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getPauseFramesSuspense } from "ui/suspense/frameCache";
import { getAsyncParentPauseIdSuspense } from "ui/suspense/util";
import { isPointInRegions } from "ui/utils/timeline";

import { selectFrame as selectFrameAction } from "../../../actions/pause/selectFrame";
import { toggleFrameworkGrouping as setFrameworkGroupingAction } from "../../../reducers/ui";
import { copyToTheClipboard } from "../../../utils/clipboard";
import { getAllCachedPauseFrames } from "../../../utils/frames";
import { collapseFrames, formatCopyName } from "../../../utils/pause/frames";
import Frame from "./Frame";
import Group from "./Group";
import { CommonFrameComponentProps } from ".";

function FramesRenderer({
  panel,
  pauseId,
  asyncIndex = 0,
}: {
  panel: CommonFrameComponentProps["panel"];
  pauseId: PauseId;
  asyncIndex?: number;
}) {
  const sourcesState = useAppSelector(state => state.sources);
  const loadedRegions = useAppSelector(getLoadedRegions);
  const dispatch = useAppDispatch();

  if (!loadedRegions?.loaded) {
    return null;
  }

  const asyncSeparator =
    asyncIndex > 0 ? (
      <div role="listitem">
        <span className="location-async-cause">
          <span className="async-label">async</span>
        </span>
      </div>
    ) : null;

  const asyncParentPauseId = getAsyncParentPauseIdSuspense(
    pauseId,
    asyncIndex,
    loadedRegions?.loaded
  );
  if (asyncParentPauseId === null) {
    return (
      <>
        {asyncSeparator}
        <div className="pane-info empty">
          This part of the call stack is unavailable because it is outside{" "}
          <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusModeAction)}>
            your debugging window
          </span>
          .
        </div>
      </>
    );
  }

  let frames = asyncParentPauseId
    ? getPauseFramesSuspense(asyncParentPauseId, sourcesState)
    : undefined;
  if (asyncIndex > 0) {
    frames = frames?.slice(1);
  }

  if (!frames?.length) {
    if (asyncIndex > 0) {
      return null;
    }
    return <div className="pane-info empty">Not paused at a point with a call stack</div>;
  }

  return (
    <>
      {asyncSeparator}
      <PauseFrames pauseId={pauseId} frames={frames} panel={panel} />
      <ErrorBoundary
        key={pauseId}
        fallback={<div className="pane-info empty">Error loading frames</div>}
      >
        <Suspense fallback={<div className="pane-info empty">Loading async frames…</div>}>
          <FramesRenderer panel={panel} pauseId={pauseId} asyncIndex={asyncIndex + 1} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

function PauseFrames({
  pauseId,
  frames,
  panel,
}: {
  pauseId: PauseId;
  frames: PauseFrame[];
  panel: CommonFrameComponentProps["panel"];
}) {
  const sourcesState = useAppSelector(state => state.sources);
  const currentPauseId = useAppSelector(getPauseId);
  const loadedRegions = useAppSelector(getLoadedRegions);
  const cx = useAppSelector(getThreadContext);
  const frameworkGroupingOn = useAppSelector(getFrameworkGroupingState);
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const dispatch = useAppDispatch();

  function selectFrame(cx: Context, frame: PauseFrame) {
    if (pauseId !== currentPauseId) {
      const pause = Pause.getById(pauseId);
      if (!pause?.point || !loadedRegions || !isPointInRegions(loadedRegions.loaded, pause.point)) {
        return;
      }
      ThreadFront.timeWarpToPause(pause);
    }
    dispatch(selectFrameAction(cx, frame));
  }

  function toggleFrameworkGrouping() {
    dispatch(setFrameworkGroupingAction(!frameworkGroupingOn));
  }

  function copyStackTrace() {
    const framesToCopy = getAllCachedPauseFrames(pauseId, sourcesState)
      ?.map(f => formatCopyName(f))
      .join("\n");
    copyToTheClipboard(framesToCopy);
  }

  const commonProps: CommonFrameComponentProps = {
    cx,
    toggleFrameworkGrouping,
    frameworkGroupingOn,
    selectFrame,
    selectedFrameId,
    displayFullUrl: false,
    disableContextMenu: false,
    copyStackTrace,
    panel,
  };

  const framesOrGroups = useMemo(
    () => (frames && frameworkGroupingOn ? collapseFrames(frames) : frames),
    [frames, frameworkGroupingOn]
  );

  return (
    <>
      {framesOrGroups?.map(frameOrGroup => {
        if (Array.isArray(frameOrGroup)) {
          return <Group {...commonProps} group={frameOrGroup} key={frameOrGroup[0].id} />;
        } else {
          return <Frame {...commonProps} frame={frameOrGroup} key={frameOrGroup.id} />;
        }
      })}
    </>
  );
}

export default function Frames({
  panel,
  pauseId,
}: {
  panel: CommonFrameComponentProps["panel"];
  pauseId: PauseId;
}) {
  const sourcesLoading = useAppSelector(getSourcesLoading);
  const loadedRegions = useAppSelector(getLoadedRegions);
  const dispatch = useAppDispatch();
  const pause = Pause.getById(pauseId);

  if (sourcesLoading || !loadedRegions || !pause?.point) {
    return null;
  }

  if (!isPointInRegions(loadedRegions.loaded, pause.point)) {
    return (
      <div className="pane frames">
        <div className="pane-info empty">
          The call stack is unavailable because it is outside{" "}
          <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusModeAction)}>
            your debugging window
          </span>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="pane frames" data-test-id="FramesPanel">
      <ErrorBoundary fallback={<div className="pane-info empty">Error loading frames</div>}>
        <Suspense fallback={<div className="pane-info empty">Loading…</div>}>
          <div role="list">
            <FramesRenderer pauseId={pauseId} panel={panel} />
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
