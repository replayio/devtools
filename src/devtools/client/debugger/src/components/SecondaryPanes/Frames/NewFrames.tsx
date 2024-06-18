import { ExecutionPoint, PauseId } from "@replayio/protocol";
import { Suspense, useContext, useMemo } from "react";
import { useImperativeCacheValue } from "suspense";

import {
  Context,
  PauseFrame,
  getFrameworkGroupingState,
  getPauseId,
  getSelectedFrameId,
  getThreadContext,
} from "devtools/client/debugger/src/selectors";
import { InlineErrorBoundary } from "replay-next/components/errors/InlineErrorBoundary";
import { copyToClipboard } from "replay-next/components/sources/utils/clipboard";
import { FocusContext } from "replay-next/src/contexts/FocusContext";
import { useCurrentFocusWindow } from "replay-next/src/hooks/useCurrentFocusWindow";
import { useIsPointWithinFocusWindow } from "replay-next/src/hooks/useIsPointWithinFocusWindow";
import { getPointAndTimeForPauseId, pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { isPointInRegion } from "shared/utils/time";
import { enterFocusMode, seek } from "ui/actions/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { getPauseFramesSuspense } from "ui/suspense/frameCache";
import { getAsyncParentPauseIdSuspense } from "ui/suspense/util";

import { selectFrame as selectFrameAction } from "../../../actions/pause/selectFrame";
import { toggleFrameworkGrouping as setFrameworkGroupingAction } from "../../../reducers/ui";
import { getAllCachedPauseFrames } from "../../../utils/frames";
import { collapseFrames, formatCopyName } from "../../../utils/pause/frames";
import { FrameComponent as Frame } from "./Frame";
import { Group } from "./Group";
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
  const replayClient = useContext(ReplayClientContext);
  const sourcesState = useAppSelector(state => state.sources);
  const { rangeForSuspense: focusWindow } = useContext(FocusContext);
  const dispatch = useAppDispatch();

  if (focusWindow === null) {
    return null;
  }

  const asyncSeparator =
    asyncIndex > 0 ? (
      <div role="listitem">
        <span className="location-async-cause" data-test-name="AsyncParentLabel">
          <span className="async-label">async</span>
        </span>
      </div>
    ) : null;

  const asyncParentPauseId = getAsyncParentPauseIdSuspense(
    replayClient,
    pauseId,
    asyncIndex,
    focusWindow
  );
  if (asyncParentPauseId === true) {
    return (
      <>
        {asyncSeparator}
        <div className="pane-info empty" data-test-name="AsyncParentUnavailable">
          This part of the call stack is unavailable because it is outside{" "}
          <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusMode())}>
            your debugging window
          </span>
          .
        </div>
      </>
    );
  }

  let frames =
    typeof asyncParentPauseId === "string"
      ? getPauseFramesSuspense(replayClient, asyncParentPauseId, sourcesState)
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
      <InlineErrorBoundary
        key={pauseId}
        name="NewFrames"
        fallback={<div className="pane-info empty">Error loading frames :(</div>}
      >
        <Suspense
          fallback={
            <div className="pane-info empty" data-test-name="FramesLoading">
              Loading async frames…
            </div>
          }
        >
          <FramesRenderer panel={panel} pauseId={pauseId} asyncIndex={asyncIndex + 1} />
        </Suspense>
      </InlineErrorBoundary>
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
  const focusWindow = useCurrentFocusWindow();
  const cx = useAppSelector(getThreadContext);
  const frameworkGroupingOn = useAppSelector(getFrameworkGroupingState);
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const dispatch = useAppDispatch();

  async function selectFrame(cx: Context, frame: PauseFrame) {
    if (pauseId !== currentPauseId) {
      const [point, time] = getPointAndTimeForPauseId(pauseId);
      if (point === null || time === null || !focusWindow || !isPointInRegion(point, focusWindow)) {
        return;
      }
      await dispatch(
        seek({ executionPoint: point, time, pauseId, location: frame.location, openSource: true })
      );
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
    copyToClipboard(framesToCopy || "");
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

interface FramesProps {
  panel: CommonFrameComponentProps["panel"];
  point: ExecutionPoint;
  time: number;
}

function Frames({ panel, point, time }: FramesProps) {
  const replayClient = useContext(ReplayClientContext);
  const cachedSources = useImperativeCacheValue(sourcesCache, replayClient);
  const sourcesLoading = cachedSources.status !== "resolved";
  const dispatch = useAppDispatch();

  const isInFocusRegion = useIsPointWithinFocusWindow(point);

  if (sourcesLoading) {
    return null;
  }

  if (!isInFocusRegion) {
    return (
      <div className="pane frames">
        <div className="pane-info empty">
          The call stack is unavailable because it is outside{" "}
          <span className="cursor-pointer underline" onClick={() => dispatch(enterFocusMode())}>
            your debugging window
          </span>
          .
        </div>
      </div>
    );
  }

  const pauseId = pauseIdCache.read(replayClient, point, time);

  return (
    <div className="pane frames" data-test-id="FramesPanel">
      <InlineErrorBoundary
        key={pauseId}
        name="Frames"
        fallback={<div className="pane-info empty">Error loading frames :((</div>}
      >
        <Suspense
          fallback={
            <div className="pane-info empty" data-test-name="FramesLoading">
              Loading...
            </div>
          }
        >
          <div role="list">
            <FramesRenderer pauseId={pauseId} panel={panel} />
          </div>
        </Suspense>
      </InlineErrorBoundary>
    </div>
  );
}

export default function NewFrames(props: FramesProps) {
  return (
    <Suspense
      fallback={
        <div className="pane">
          <div className="pane-info empty" data-test-name="FramesLoading">
            Loading...
          </div>
        </div>
      }
    >
      <Frames {...props} />
    </Suspense>
  );
}
