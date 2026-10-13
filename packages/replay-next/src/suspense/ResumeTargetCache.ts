import { ExecutionPoint, PauseDescription, SourceId, SourceLocation } from "@replayio/protocol";
import { createCache } from "suspense";

import { locationsInclude } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

import { PauseAndFrameId } from "../contexts/SelectedFrameContext";
import { framesCache } from "./FrameCache";
import { getPointAndTimeForPauseId, updateMappedLocation } from "./PauseCache";
import { pointStackCache } from "./PointStackCache";
import { sourceOutlineCache } from "./SourceOutlineCache";
import { sourcesByIdCache } from "./SourcesCache";

export const FIND_STEP_TARGET_COMMANDS = [
  "findStepInTarget",
  "findStepOutTarget",
  "findStepOverTarget",
  "findReverseStepOverTarget",
] as const;
export const FIND_TARGET_COMMANDS = [...FIND_STEP_TARGET_COMMANDS] as const;
export type FindTargetCommand = (typeof FIND_TARGET_COMMANDS)[number];

const resumeTargetForPointCache = createCache<
  [replayClient: ReplayClientInterface, command: FindTargetCommand, point: ExecutionPoint],
  PauseDescription
>({
  debugLabel: "ResumeTargetForPoint",
  getKey: ([, point, command]) => `${point}:${command}`,
  load: async ([replayClient, command, point]) => {
    const sources = await sourcesByIdCache.readAsync(replayClient);
    const target = await replayClient[command](point);
    if (target.frame) {
      updateMappedLocation(sources, target.frame);
    }
    return target;
  },
});

export const resumeTargetCache = createCache<
  [
    replayClient: ReplayClientInterface,
    command: FindTargetCommand,
    point: ExecutionPoint | null,
    pauseAndFrameId: PauseAndFrameId | null,
    sourceId: SourceId | undefined
  ],
  PauseDescription | undefined
>({
  debugLabel: "ResumeTarget",
  getKey: ([, command, point, pauseAndFrameId, sourceId]) =>
    `${command}:${point}:${pauseAndFrameId?.pauseId}:${pauseAndFrameId?.frameId}:${sourceId}`,
  load: async ([replayClient, command, point, pauseAndFrameId, sourceId]) => {
    if (!point) {
      return;
    }

    let currentPoint = point;
    if (pauseAndFrameId) {
      const [pausePoint] = getPointAndTimeForPauseId(pauseAndFrameId.pauseId);
      if (!pausePoint) {
        return;
      }

      const frames = await framesCache.readAsync(replayClient, pauseAndFrameId.pauseId);
      const frameIndex = frames?.findIndex(frame => frame.frameId === pauseAndFrameId.frameId);
      if (frameIndex === undefined || frameIndex < 0) {
        return;
      }

      if (frameIndex > 0) {
        const pointStack = await pointStackCache.readAsync(0, frameIndex, replayClient, pausePoint);
        const frame = pointStack[frameIndex];
        if (!frame.point) {
          // Avoid stepping in the top frame - we need to step in the _current_ frame.
          // Note that it's unlikely that we _will_ hit this case.
          // Per Josh, the most likely reason a stack frame would _not_ have an execution point
          // is if there's no actual code inside, such as `class B extends A` where B has no constructor.
          // We _could_ look for the next frame that _does_ have an execution point instead.
          return;
        }
        currentPoint = frame.point.point;
      }
    }

    let locationsToSkip: SourceLocation[] | undefined = undefined;
    if ((command === "findStepOverTarget" || command === "findReverseStepOverTarget") && sourceId) {
      const symbols = await sourceOutlineCache.readAsync(replayClient, sourceId);
      locationsToSkip = symbols.functions.map(f => f.body).filter(Boolean) as SourceLocation[];
    }

    while (true) {
      let target: PauseDescription;
      try {
        target = await resumeTargetForPointCache.readAsync(replayClient, command, currentPoint);
      } catch {
        return;
      }

      if (locationsToSkip) {
        const location = target.frame?.find(location => location.sourceId === sourceId);
        if (location && locationsInclude(locationsToSkip, location)) {
          currentPoint = target.point;
          continue;
        }
      }

      return target;
    }
  },
});

export function evictResumeTargets() {
  resumeTargetForPointCache.evictAll();
  resumeTargetCache.evictAll();
}
