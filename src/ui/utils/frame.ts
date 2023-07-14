import { Location, TimeStampedPoint } from "@replayio/protocol";

import { PauseFrame } from "devtools/client/debugger/src/selectors";
import { frameStepsCache } from "replay-next/src/suspense/FrameStepsCache";
import { ReplayClientInterface } from "shared/client/types";

export interface PointWithLocation {
  location: Location;
  point?: TimeStampedPoint;
}

export async function getMatchingFrameStep(
  replayClient: ReplayClientInterface,
  frame: PauseFrame,
  searchLocation: Location
) {
  const frameSteps = await frameStepsCache.readAsync(replayClient, frame.pauseId, frame.protocolId);
  const pointsWithLocations =
    frameSteps?.flatMap(step => {
      return step.frame
        ?.map(l => {
          return {
            location: l,
            point: step,
          };
        })
        .filter(Boolean) as PointWithLocation[];
    }) ?? [];

  // One of these locations should match up
  const matchingFrameStep: PointWithLocation | undefined = pointsWithLocations.find(step => {
    // Intentionally ignore columns for now - this seems to produce better results
    // that line up with the hit points in a print statement
    return (
      step.location.sourceId === searchLocation.sourceId &&
      step.location.line === searchLocation.line
    );
  });

  return matchingFrameStep;
}
