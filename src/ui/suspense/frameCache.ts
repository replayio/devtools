import { Frame, PauseId } from "@replayio/protocol";

import { createFrame } from "devtools/client/debugger/src/client/create";
import { PauseAndFrameId } from "devtools/client/debugger/src/selectors";
import { formatCallStackFrames } from "devtools/client/debugger/src/selectors/getCallStackFrames";
import { createUseGetValue } from "replay-next/src/suspense/createGenericCache";
import {
  getFrameSuspense,
  getFramesAsync,
  getFramesIfCached,
  getFramesSuspense,
} from "replay-next/src/suspense/FrameCache";
import { ReplayClientInterface } from "shared/client/types";
import { SourcesState } from "ui/reducers/sources";

export const useGetFrames = createUseGetValue<
  [replayClient: ReplayClientInterface, pauseId: PauseId | undefined],
  Frame[] | undefined
>(
  async (replayClient, pauseId) =>
    pauseId ? await getFramesAsync(replayClient, pauseId) : undefined,
  (replayClient, pauseId) => (pauseId ? getFramesIfCached(pauseId) : { value: undefined }),
  (replayClient, pauseId) => pauseId ?? ""
);

export function getPauseFramesSuspense(
  replayClient: ReplayClientInterface,
  pauseId: PauseId,
  sourcesState: SourcesState
) {
  const frames = getFramesSuspense(replayClient, pauseId);
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
  const frames = await getFramesAsync(replayClient, pauseId);
  return frames ? createPauseFrames(pauseId, frames, sourcesState) : undefined;
}

export async function getPauseFrameAsync(
  replayClient: ReplayClientInterface,
  pauseAndFrameId: PauseAndFrameId,
  sourcesState: SourcesState
) {
  const frame = (await getFramesAsync(replayClient, pauseAndFrameId.pauseId))?.find(
    frame => frame.frameId === pauseAndFrameId.frameId
  );
  return frame ? createPauseFrames(pauseAndFrameId.pauseId, [frame], sourcesState)[0] : undefined;
}

export function getPauseFramesIfCached(pauseId: PauseId, sourcesState: SourcesState) {
  const frames = getFramesIfCached(pauseId);
  if (!frames?.value) {
    return undefined;
  }
  return createPauseFrames(pauseId, frames.value, sourcesState);
}

function createPauseFrames(pauseId: PauseId, frames: Frame[], sourcesState: SourcesState) {
  return formatCallStackFrames(
    frames.map((frame, index) => createFrame(sourcesState, frame, pauseId, index)),
    sourcesState.sourceDetails.entities
  )!;
}
