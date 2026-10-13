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
import findLast from "lodash/findLast";
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
  executionLocation?: Location;
  point?: PointDescription;
  functionDetails?: FormattedEventListener;
}

export interface FormattedPointStack {
  point: PointDescription;
  allFrames: FormattedPointStackFrame[];
  filteredFrames: FormattedPointStackFrame[];
}

export interface FormattedPointStackWithRelevantFrame extends FormattedPointStack {
  resultPoint: PointDescription;
  frame?: FormattedPointStackFrame;
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

    const formattedFrames = pointStack.map(frame => {
      updateMappedLocationForPointStackFrame(sourcesById, frame);
      const functionLocation = getPreferredLocation(sourcesById, [], frame.functionLocation);
      const executionLocation =
        frame.point?.frame && getPreferredLocation(sourcesById, [], frame.point.frame);

      const source = sourcesById.get(functionLocation.sourceId)!;

      const formattedFrame: FormattedPointStackFrame = {
        url: source.url,
        source,
        functionLocation,
        executionLocation,
        point: frame.point,
      };
      return formattedFrame;
    });

    const filteredPauseFrames = formattedFrames.filter(frame => {
      const { source } = frame;
      if (!source.url) {
        return false;
      }
      // Filter out stack frames we might not care about, such as React or Redux internals
      return !ignoreFileUrls.some(partialUrl => source.url?.includes(partialUrl));
    });

    return {
      point,
      allFrames: formattedFrames,
      filteredFrames: filteredPauseFrames,
    };
  },
});

export const relevantAppFrameCache: Cache<
  [replayClient: ReplayClientInterface, point: PointDescription, ignoreFileUrls?: string[]],
  FormattedPointStackWithRelevantFrame
> = createCache({
  debugLabel: "FormattedPointStack",
  getKey: ([replayClient, point, ignoreFileUrls = MORE_IGNORABLE_PARTIAL_URLS]) => {
    // turn these into one giant string, since the URLs affects the filtering
    return [point.point, ...ignoreFileUrls].join();
  },
  async load([replayClient, point, ignoreFileUrls = MORE_IGNORABLE_PARTIAL_URLS]) {
    const formattedPointStack = await formattedPointStackCache.readAsync(
      replayClient,
      point,
      ignoreFileUrls
    );

    // We want the newest app stack frame that appears to be useful.
    // This logic is typically being used to find a frame that triggered
    // a React or Redux state update.  There may be many user app code frames
    // in the current stack, but the newest one is probably what triggered the update.
    // Because of that, we need to search backwards from the newest frames.
    // If this is a React update, that should be what called `setState()`
    // But, React also calls `scheduleUpdate` frequently _internally_.
    // So, there may not be any app code frames at all.
    let relevantAppCodeFrame: FormattedPointStackFrame | undefined = undefined;
    const { filteredFrames } = formattedPointStack;

    // Start by seeing it here's any frames that have a sourcemapped source.
    // Ideally we'll go with that.
    relevantAppCodeFrame = findLast(filteredFrames, frame => {
      return frame.source.kind === "sourceMapped";
    });

    if (!relevantAppCodeFrame) {
      // Otherwise, go with the newest frame
      relevantAppCodeFrame = filteredFrames.slice(-1)[0];
    }

    let functionName;
    let resultPoint = point;

    if (relevantAppCodeFrame) {
      if (relevantAppCodeFrame.point) {
        // We _want_ to go to this line of code at the time that it ran.
        // Technically the backend might not return an execution point for this stack frame.
        // Handle that (hopefully unlikely) case by still using the original point
        // at the "current" part of the stack trace, which would mean that we'd be showing
        // the earlier stack frame but be paused at the "current" time.
        // In discussion with Josh, this situation should almost never happen.
        // The most plausible reason to be missing an execution point is something like
        // `class B extends A`, where `B` has no constructor.
        // Realistically, we're looking at React or Redux user app logic here,
        // so we should always have actual code and thus an execution point.
        resultPoint = relevantAppCodeFrame.point;
      }

      const formattedFunction =
        relevantAppCodeFrame.executionLocation &&
        (await formatFunctionDetailsFromLocation(
          replayClient,
          "unknown",
          relevantAppCodeFrame.executionLocation
        ));

      functionName = formattedFunction?.functionName;
    }

    return {
      ...formattedPointStack,
      functionName,
      resultPoint,
      frame: relevantAppCodeFrame!,
    };
  },
});
