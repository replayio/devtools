import { ExecutionPoint, PointStackFrame } from "@replayio/protocol";
import { IntervalCache, createIntervalCache } from "suspense";

import { ReplayClientInterface } from "shared/client/types";

import { updateMappedLocation } from "./PauseCache";
import { Source, sourcesByIdCache } from "./SourcesCache";

export const pointStackCache: IntervalCache<
  number,
  [replayClient: ReplayClientInterface, point: ExecutionPoint],
  PointStackFrame & { index: number }
> = createIntervalCache({
  debugLabel: "pointStackCache",
  getPointForValue: pointStackFrame => pointStackFrame.index,
  getKey: (client, point) => point,
  load: async (start, end, client, point) => {
    const pointStack = await client.getPointStack(point, end + 1);
    const sources = await sourcesByIdCache.readAsync(client);
    return pointStack.slice(start).map((frame, index) => {
      updateMappedLocationForPointStackFrame(sources, frame);
      return { ...frame, index: index + start };
    });
  },
});

export function updateMappedLocationForPointStackFrame(
  sources: Map<string, Source>,
  frame: PointStackFrame
) {
  updateMappedLocation(sources, frame.functionLocation);
  if (frame.point?.frame) {
    updateMappedLocation(sources, frame.point.frame);
  }
}

export async function getPointDescriptionForFrame(
  replayClient: ReplayClientInterface,
  point: ExecutionPoint,
  frameIndex: number
) {
  const pointStackFrames = await pointStackCache.readAsync(0, frameIndex, replayClient, point);
  return pointStackFrames[frameIndex].point;
}
