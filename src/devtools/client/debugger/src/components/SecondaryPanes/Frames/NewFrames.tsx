import { Suspense, useMemo } from "react";
import { PauseId } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  getFrameworkGroupingState,
  getPauseId,
  getSelectedFrame,
  getThreadContext,
  PauseFrame,
} from "devtools/client/debugger/src/selectors";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { getSourceDetailsEntities, getSourcesLoading, SourcesState } from "ui/reducers/sources";
import { formatCallStackFrames } from "../../../selectors/getCallStackFrames";
import { selectFrame as selectFrameAction } from "../../../actions/pause/selectFrame";
import { toggleFrameworkGrouping as setFrameworkGroupingAction } from "../../../reducers/ui";
import { enterFocusMode as enterFocusModeAction } from "ui/actions/timeline";
import { getFramesIfCached } from "ui/suspense/frameCache";
import { getFrameStepsIfCached } from "ui/suspense/frameStepsCache";
import { getAsyncParentFramesSuspense } from "ui/suspense/util";
import { createFrame } from "../../../client/create";
import { collapseFrames, formatCopyName } from "../../../utils/pause/frames";
import { copyToTheClipboard } from "../../../utils/clipboard";
import ErrorBoundary from "bvaughn-architecture-demo/components/ErrorBoundary";
import Frame from "./Frame";
import Group from "./Group";
import { CommonFrameComponentProps } from ".";

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
  const sources = useAppSelector(getSourceDetailsEntities);
  const sourcesState = useAppSelector(state => state.sources);

  const protocolFrames = getAsyncParentFramesSuspense(pauseId, asyncIndex);
  const frames = useMemo(
    () =>
      formatCallStackFrames(
        protocolFrames?.map((protocolFrame, index) =>
          createFrame(
            sourcesState,
            ThreadFront.preferredGeneratedSources,
            protocolFrame,
            index,
            asyncIndex
          )
        ) || null,
        sources
      ),
    [asyncIndex, protocolFrames, sources, sourcesState]
  );

  if (!frames?.length) {
    if (asyncIndex > 0) {
      return null;
    }
    return <div className="pane-info empty">Not paused at a point with a call stack</div>;
  }

  return (
    <>
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
  const selectedFrame = useAppSelector(getSelectedFrame);
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
    selectedFrame,
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

  const getAllFrames = () => getAllCachedPauseFrames(pauseId!, sourcesState);

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

// collects all displayed (and hence cached) frames from the given pauseId
// and its async parent pauseIds and converts them to PauseFrames
function getAllCachedPauseFrames(pauseId: PauseId, sourcesState: SourcesState): PauseFrame[] {
  let allPauseFrames: PauseFrame[] = [];
  let asyncIndex = 0;
  while (true) {
    const pauseFrames = formatCallStackFrames(
      getFramesIfCached(pauseId)?.map((protocolFrame, index) =>
        createFrame(
          sourcesState,
          ThreadFront.preferredGeneratedSources,
          protocolFrame,
          index,
          asyncIndex
        )
      ) || null,
      sourcesState.sourceDetails.entities
    );
    if (!pauseFrames?.length) {
      break;
    }
    allPauseFrames = allPauseFrames.concat(pauseFrames);

    const steps = getFrameStepsIfCached(pauseId, pauseFrames[pauseFrames.length - 1].protocolId);
    if (!steps?.length) {
      break;
    }
    const asyncParentPause = ThreadFront.ensurePause(steps[0].point, steps[0].time);
    if (!asyncParentPause.pauseId) {
      break;
    }
    pauseId = asyncParentPause.pauseId;
    asyncIndex++;
  }

  return allPauseFrames;
}
