import { Suspense, useMemo } from "react";
import { PauseId } from "@replayio/protocol";
import { ThreadFront } from "protocol/thread";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import {
  getFrameworkGroupingState,
  getPauseId,
  getSelectedFrame,
  getThreadContext,
} from "devtools/client/debugger/src/selectors";
import { isCurrentTimeInLoadedRegion } from "ui/reducers/app";
import { getSourceDetailsEntities, getSourcesLoading } from "ui/reducers/sources";
import { formatCallStackFrames } from "../../../selectors/getCallStackFrames";
import { selectFrame as selectFrameAction } from "../../../actions/pause/selectFrame";
import { toggleFrameworkGrouping as setFrameworkGroupingAction } from "../../../reducers/ui";
import { enterFocusMode as enterFocusModeAction } from "ui/actions/timeline";
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
}: {
  panel: "debugger" | "console" | "webconsole";
  pauseId: PauseId;
  asyncIndex?: number;
}) {
  const state = useAppSelector(state => state);
  const cx = getThreadContext(state);
  const sources = getSourceDetailsEntities(state);
  const frameworkGroupingOn = getFrameworkGroupingState(state);
  const selectedFrame = getSelectedFrame(state);
  const dispatch = useAppDispatch();

  function toggleFrameworkGrouping() {
    dispatch(setFrameworkGroupingAction(!frameworkGroupingOn));
  }
  function selectFrame(...args: Parameters<typeof selectFrameAction>) {
    dispatch(selectFrameAction(...args));
  }
  //TODO copy async parent frames as well
  function copyStackTrace() {
    const framesToCopy = frames?.map(f => formatCopyName(f)).join("\n");
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

  const protocolFrames = getAsyncParentFramesSuspense(pauseId, asyncIndex);
  const frames = useMemo(
    () =>
      formatCallStackFrames(
        protocolFrames?.map((protocolFrame, index) =>
          createFrame(
            state.sources,
            ThreadFront.preferredGeneratedSources,
            protocolFrame,
            index,
            asyncIndex
          )
        ) || null,
        sources
      ),
    [asyncIndex, protocolFrames, sources, state.sources]
  );
  const framesOrGroups = useMemo(
    () => (frames && frameworkGroupingOn ? collapseFrames(frames) : frames),
    [frames, frameworkGroupingOn]
  );

  if (!frames?.length) {
    if (asyncIndex > 0) {
      return null;
    }
    return <div className="pane-info empty">Not paused at a point with a call stack</div>;
  }

  return (
    <>
      {framesOrGroups?.map(frameOrGroup => {
        if (Array.isArray(frameOrGroup)) {
          return <Group {...commonProps} group={frameOrGroup} key={frameOrGroup[0].id} />;
        } else {
          return <Frame {...commonProps} frame={frameOrGroup} key={frameOrGroup.id} />;
        }
      })}
      <Suspense fallback={<div className="pane-info empty">Loading async frames…</div>}>
        <FramesRenderer panel={panel} pauseId={pauseId} asyncIndex={asyncIndex + 1} />
      </Suspense>
    </>
  );
}

export default function Frames({ panel }: { panel: "debugger" | "console" | "webconsole" }) {
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

  return (
    <div className="pane frames">
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
