import {
  ExecutionPoint,
  Frame,
  FunctionMatch,
  FunctionOutline,
  Location,
  PauseDescription,
  PauseId,
  PointDescription,
  PointStackFrame,
  RunEvaluationResult,
  TimeStampedPoint,
  TimeStampedPointRange,
} from "@replayio/protocol";
import { Cache, createCache } from "suspense";

import { createFrame } from "devtools/client/debugger/src/client/create";
import { PauseAndFrameId } from "devtools/client/debugger/src/selectors";
import { formatCallStackFrames } from "devtools/client/debugger/src/selectors/getCallStackFrames";
import { framesCache, getFrameSuspense } from "replay-next/src/suspense/FrameCache";
import { updateMappedLocationForPointStackFrame } from "replay-next/src/suspense/PointStackCache";
import { Source, sourcesByIdCache } from "replay-next/src/suspense/SourcesCache";
import { getPreferredLocation } from "replay-next/src/utils/sources";
import { ReplayClientInterface } from "shared/client/types";
import {
  FormattedEventListener,
  MORE_IGNORABLE_PARTIAL_URLS,
  formatFunctionDetailsFromLocation,
} from "ui/actions/eventListeners/eventListenerUtils";
import { SourcesState } from "ui/reducers/sources";

export function getPauseFramesSuspense(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  sourcesState: SourcesState
) {
  const frames = framesCache.read(replayClient, pauseId);
  return frames ? createPauseFrames(pauseId, frames, sourcesState) : undefined;
}

export function getPauseFrameSuspense(
  replayClient: ReplayClientInterface,
  pauseAndFrameId: PauseAndFrameId,
  sourcesState: SourcesState
) {
  const { frameId, pauseId } = pauseAndFrameId;
  const frame = getFrameSuspense(replayClient, pauseId, frameId);
  return frame ? createPauseFrames(pauseId, [frame], sourcesState)[0] : undefined;
}

export async function getPauseFramesAsync(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  sourcesState: SourcesState
) {
  const frames = await framesCache.readAsync(replayClient, pauseId);
  return frames ? createPauseFrames(pauseId, frames, sourcesState) : undefined;
}

export async function getPauseFrameAsync(
  replayClient: ReplayClientInterface,
  pauseAndFrameId: PauseAndFrameId,
  sourcesState: SourcesState
) {
  const frame = (await framesCache.readAsync(replayClient, pauseAndFrameId.pauseId))?.find(
    frame => frame.frameId === pauseAndFrameId.frameId
  );
  return frame ? createPauseFrames(pauseAndFrameId.pauseId, [frame], sourcesState)[0] : undefined;
}

export function getPauseFramesIfCached(pauseId: PauseId, sourcesState: SourcesState) {
  const frames = framesCache.getValueIfCached(null as any, pauseId);
  if (!frames) {
    return undefined;
  }
  return createPauseFrames(pauseId, frames, sourcesState);
}

function createPauseFrames(pauseId: PauseId, frames: Frame[], sourcesState: SourcesState) {
  return formatCallStackFrames(
    frames.map((frame, index) => createFrame(sourcesState, frame, pauseId, index)),
    sourcesState.sourceDetails.entities
  )!;
}

export interface FormattedPointStackFrame {
  url?: string;
  source: Source;
  functionLocation: Location;
  executionLocation: Location;
  point: PointDescription;
  functionDetails?: FormattedEventListener;
}

export interface FormattedPointStack {
  point: PointDescription;
  resultPoint: PointDescription;
  frame?: FormattedPointStackFrame;
  allFrames: FormattedPointStackFrame[];
  filteredFrames: FormattedPointStackFrame[];
  functionName?: string;
}

export const formattedPointStackCache: Cache<
  [replayClient: ReplayClientInterface, point: PointDescription, ignoreFileUrls?: string[]],
  FormattedPointStack
> = createCache({
  debugLabel: "FormattedPointStack",
  getKey: ([replayClient, point, ignoreFileUrls = MORE_IGNORABLE_PARTIAL_URLS]) => {
    // turn these into one giant string, since the URLs affects the filtering
    return [point.point, ...ignoreFileUrls].join();
  },
  async load([replayClient, point, ignoreFileUrls = MORE_IGNORABLE_PARTIAL_URLS]) {
    const sourcesById = await sourcesByIdCache.readAsync(replayClient);
    // Some arbitrary guesses about how many frames we should fetch. Prefer frameDepth, cap at 60
    const framesToFetch = Math.min(point.frameDepth ?? 60, 60);
    const pointStack = await replayClient.getPointStack(point.point, framesToFetch);
    const formattedFrames = await Promise.all(
      pointStack.map(async frame => {
        updateMappedLocationForPointStackFrame(sourcesById, frame);
        const functionLocation = getPreferredLocation(sourcesById, [], frame.functionLocation);
        const executionLocation = getPreferredLocation(sourcesById, [], frame.point.frame ?? []);

        const source = sourcesById.get(functionLocation.sourceId)!;

        return {
          url: source.url,
          source,
          functionLocation,
          executionLocation,
          point: frame.point,
          functionDetails: await formatFunctionDetailsFromLocation(
            replayClient,
            "unknown",
            functionLocation
          ),
        };
      })
    );

    const filteredPauseFrames = formattedFrames.filter(frame => {
      const { source } = frame;
      if (!source.url) {
        return false;
      }
      // Filter out stack frames we might not care about, such as React or Redux internals
      return !ignoreFileUrls.some(partialUrl => source.url?.includes(partialUrl));
    });

    // We want the oldest app stack frame.
    // If this is a React update, that should be what called `setState()`
    // But, React also calls `scheduleUpdate` frequently _internally_.
    // So, there may not be any app code frames at all.
    let earliestAppCodeFrame: FormattedPointStackFrame | undefined =
      filteredPauseFrames.slice(-1)[0];

    let functionName;

    let resultPoint = point;
    if (earliestAppCodeFrame) {
      resultPoint = earliestAppCodeFrame.point;
      const formattedFunction = await formatFunctionDetailsFromLocation(
        replayClient,
        "unknown",
        earliestAppCodeFrame.executionLocation
      );
      functionName = formattedFunction?.functionName;
    }

    return {
      point,
      functionName,
      resultPoint,
      frame: earliestAppCodeFrame!,
      allFrames: formattedFrames,
      filteredFrames: filteredPauseFrames,
    };
  },
});
