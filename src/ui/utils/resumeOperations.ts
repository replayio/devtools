import {
  ExecutionPoint,
  PauseDescription,
  SourceId,
  SourceLocation,
  loadedRegions,
} from "@replayio/protocol";

import { ThreadFront } from "protocol/thread";
import { locationsInclude } from "protocol/utils";
import { ReplayClientInterface } from "shared/client/types";

export interface ResumeOperationParams {
  point?: ExecutionPoint;
  loadedRegions: loadedRegions;
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
    loadedRegions,
    sourceId,
    locationsToSkip,
  }: ResumeOperationParams & { point: ExecutionPoint }
) {
  if (
    loadedRegions.loaded.every(
      region =>
        BigInt(point) < BigInt(region.begin.point) || BigInt(point) > BigInt(region.end.point)
    )
  ) {
    return null;
  }

  await ThreadFront.ensureAllSources();

  while (true) {
    let target: PauseDescription;
    try {
      target = await client[findTargetCommand](point);
      if (target.frame) {
        ThreadFront.updateMappedLocation(target.frame);
      }
    } catch {
      return null;
    }

    if (
      loadedRegions.loaded.every(
        region =>
          BigInt(target!.point) < BigInt(region.begin.point) ||
          BigInt(target!.point) > BigInt(region.end.point)
      )
    ) {
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
    loadedRegions,
    locationsToSkip,
  }: ResumeOperationParams
) {
  ThreadFront.emit("resumed");

  const point = selectedPoint || ThreadFront.currentPoint;
  const resumeTarget = await findResumeTarget(client, command, {
    point,
    loadedRegions,
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
