import { Suspense, useMemo } from "react";
import { PauseId } from "@replayio/protocol";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  getFrameworkGroupingState,
  getPauseId,
  getSelectedFrameId,
  getThreadContext,
  PauseFrame,
} from "devtools/client/debugger/src/selectors";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { getSourcesLoading } from "ui/reducers/sources";
import { selectFrame as selectFrameAction } from "../../../actions/pause/selectFrame";
import { toggleFrameworkGrouping as setFrameworkGroupingAction } from "../../../reducers/ui";
import { enterFocusMode as enterFocusModeAction } from "ui/actions/timeline";
import { getAsyncParentPauseIdSuspense } from "ui/suspense/util";
import { collapseFrames, formatCopyName } from "../../../utils/pause/frames";
import { copyToTheClipboard } from "../../../utils/clipboard";
import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Frame from "./Frame";
import Group from "./Group";
import { CommonFrameComponentProps } from ".";
import { getAllCachedPauseFrames } from "../../../utils/frames";
import { getPauseFramesSuspense } from "ui/suspense/frameCache";

function FramesRenderer({
  panel,
  pauseId,
  asyncIndex = 0,
  getAllFrames,
}: {
  panel: CommonFrameComponentProps["panel"];
  pauseId: PauseId;
  asyncIndex?: number;
  getAllFrames: () => PauseFrame[];
}) {
  const sourcesState = useAppSelector(state => state.sources);

  const asyncParentPauseId = getAsyncParentPauseIdSuspense(pauseId, asyncIndex);
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
      {asyncIndex > 0 ? (
        <div role="listitem">
          <span className="location-async-cause">
            <span className="async-label">async</span>
          </span>
        </div>
      ) : null}
      <PauseFrames frames={frames} getAllFrames={getAllFrames} panel={panel} />
      <Suspense fallback={<div className="pane-info empty">Loading async frames…</div>}>
        <FramesRenderer
          panel={panel}
          pauseId={pauseId}
          asyncIndex={asyncIndex + 1}
          getAllFrames={getAllFrames}
        />
      </Suspense>
    </>
  );
}

export function PauseFrames({
  frames,
  getAllFrames,
  panel,
  selectFrame,
}: {
  frames: PauseFrame[];
  getAllFrames?: () => PauseFrame[];
  panel: CommonFrameComponentProps["panel"];
  selectFrame?: (...args: Parameters<typeof selectFrameAction>) => void;
}) {
  const cx = useAppSelector(getThreadContext);
  const frameworkGroupingOn = useAppSelector(getFrameworkGroupingState);
  const selectedFrameId = useAppSelector(getSelectedFrameId);
  const dispatch = useAppDispatch();

  if (!getAllFrames) {
    getAllFrames = () => frames;
  }
  if (!selectFrame) {
    selectFrame = (...args: Parameters<typeof selectFrameAction>) =>
      dispatch(selectFrameAction(...args));
  }
  function toggleFrameworkGrouping() {
    dispatch(setFrameworkGroupingAction(!frameworkGroupingOn));
  }

  function copyStackTrace() {
    const framesToCopy = getAllFrames!()
      .map(f => formatCopyName(f))
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

export default function Frames({ panel }: { panel: CommonFrameComponentProps["panel"] }) {
  const sourcesState = useAppSelector(state => state.sources);
  const sourcesLoading = useAppSelector(getSourcesLoading);
  const pauseId = useAppSelector(getPauseId);
  const showUnloadedRegionError = !useAppSelector(isCurrentTimeInLoadedRegion);
  const dispatch = useAppDispatch();

  if (sourcesLoading || !pauseId) {
    return null;
  }
  if (showUnloadedRegionError) {
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

  const getAllFrames = () => getAllCachedPauseFrames(pauseId, sourcesState)!;

  return (
    <div className="pane frames" data-test-id="FramesPanel">
      <ErrorBoundary fallback={<div className="pane-info empty">Error loading frames</div>}>
        <Suspense fallback={<div className="pane-info empty">Loading…</div>}>
          <div role="list">
            <FramesRenderer pauseId={pauseId} panel={panel} getAllFrames={getAllFrames} />
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
