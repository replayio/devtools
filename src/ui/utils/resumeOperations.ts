import assert from "assert";
import {
  ExecutionPoint,
  PauseDescription,
  SourceId,
  SourceLocation,
  TimeStampedPointRange,
} from "@replayio/protocol";

import { ThreadFront } from "protocol/thread";
import { locationsInclude } from "protocol/utils";
import { updateMappedLocation } from "replay-next/src/suspense/PauseCache";
import { sourcesCache } from "replay-next/src/suspense/SourcesCache";
import { ReplayClientInterface } from "shared/client/types";
import { isPointInRegion } from "shared/utils/time";

export interface ResumeOperationParams {
  point?: ExecutionPoint;
  focusWindow: TimeStampedPointRange | null;
  sourceId?: SourceId;
  locationsToSkip?: SourceLocation[];
}

type FindTargetCommand =
  | "findRewindTarget"
  | "findResumeTarget"
  | "findStepInTarget"
  | "findStepOutTarget"
  | "findStepOverTarget"
  | "findReverseStepOverTarget";

async function findResumeTarget(
  client: ReplayClientInterface,
  findTargetCommand: FindTargetCommand,
  {
    point,
    focusWindow,
    sourceId,
    locationsToSkip,
  }: ResumeOperationParams & { point: ExecutionPoint }
) {
  if (!focusWindow || !isPointInRegion(point, focusWindow)) {
    return null;
  }

  const { value: { idToSource } = {} } = await sourcesCache.readAsync(client);
  assert(idToSource != null);

  while (true) {
    let target: PauseDescription;
    try {
      target = await client[findTargetCommand](point);
      if (target.frame) {
        updateMappedLocation(idToSource, target.frame);
      }
    } catch {
      return null;
    }

    if (!focusWindow || !isPointInRegion(target!.point, focusWindow)) {
      return null;
    }

    if (locationsToSkip) {
      const location = target.frame?.find(location => location.sourceId === sourceId);
      if (location && locationsInclude(locationsToSkip, location)) {
        point = target.point;
        continue;
      }
    }

    return target;
  }
}

async function resumeOperation(
  client: ReplayClientInterface,
  command: FindTargetCommand,
  {
    point: selectedPoint,
    sourceId: selectedSourceId,
    focusWindow,
    locationsToSkip,
  }: ResumeOperationParams
) {
  ThreadFront.emit("resumed");

  const point = selectedPoint || ThreadFront.currentPoint;
  const resumeTarget = await findResumeTarget(client, command, {
    point,
    focusWindow,
    sourceId: selectedSourceId,
    locationsToSkip,
  });

  if (resumeTarget) {
    const { point, time, frame } = resumeTarget!;
    ThreadFront.timeWarp(point, time, !!frame);
  } else {
    ThreadFront.emit("paused", {
      point: ThreadFront.currentPoint,
      time: ThreadFront.currentTime,
      openSource: true,
    });
  }

  return resumeTarget;
}

function rewind(client: ReplayClientInterface, params: ResumeOperationParams) {
  return resumeOperation(client, "findRewindTarget", params);
}
function resume(client: ReplayClientInterface, params: ResumeOperationParams) {
  return resumeOperation(client, "findResumeTarget", params);
}
function stepIn(client: ReplayClientInterface, params: ResumeOperationParams) {
  return resumeOperation(client, "findStepInTarget", params);
}
function stepOut(client: ReplayClientInterface, params: ResumeOperationParams) {
  return resumeOperation(client, "findStepOutTarget", params);
}
function stepOver(client: ReplayClientInterface, params: ResumeOperationParams) {
  return resumeOperation(client, "findStepOverTarget", params);
}
function reverseStepOver(client: ReplayClientInterface, params: ResumeOperationParams) {
  return resumeOperation(client, "findReverseStepOverTarget", params);
}

export const resumeOperations = {
  rewind,
  resume,
  stepIn,
  stepOut,
  stepOver,
  reverseStepOver,
};
