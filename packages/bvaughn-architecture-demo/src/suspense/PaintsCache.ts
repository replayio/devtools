import { PaintPoint, TimeStampedPoint } from "@replayio/protocol";
import { ReplayClientInterface } from "shared/client/types";
import {
  insertEntrySorted,
  mostRecentContainedEntry,
  mostRecentEntry,
  nextEntry,
} from "protocol/utils";

import { createWakeable } from "../utils/suspense";

import { preCacheExecutionPointForTime } from "./PointsCache";
import { Wakeable } from "./types";

export enum Status {
  Cancelled,
  Failed,
  Fetching,
  Finished,
  NotStarted,
}

export interface TimeStampedPointWithPaintHash extends TimeStampedPoint {
  paintHash: string;
}

interface PaintPointRequest {
  time: number;
  wakeable: Wakeable<TimeStampedPointWithPaintHash>;
}

export let fetchingPaints: Status = Status.NotStarted;
export const receivedPaintPoints: TimeStampedPointWithPaintHash[] = [
  { point: "0", time: 0, paintHash: "" },
];
export const lastReceivedPaintPoint = () => receivedPaintPoints[receivedPaintPoints.length - 1];
export const setFetchingPaints = (status: Status) => (fetchingPaints = status);

const paintPointRequests: PaintPointRequest[] = [];

const onPaints = (paints: PaintPoint[]) => {
  for (const paint of paints.sort()) {
    while (paintPointRequests.length > 0 && paint.time > paintPointRequests[0].time) {
      paintPointRequests.shift()!.wakeable.resolve(lastReceivedPaintPoint());
    }
    const paintHash = paint.screenShots.find(desc => desc.mimeType == "image/jpeg")!.hash;
    receivedPaintPoints.push({ ...paint, paintHash });
    preCacheExecutionPointForTime(paint);
  }
};

export function getAllPaints(replayClient: ReplayClientInterface) {
  if (fetchingPaints === Status.NotStarted) {
    setFetchingPaints(Status.Fetching);
    replayClient
      .findPaints(onPaints)
      .then(() => {
        // Resolve all pending requests for times later than the last paint with
        // the last paint and then mark the paint finding record as resolved
        paintPointRequests.forEach(r => r.wakeable.resolve(lastReceivedPaintPoint()));
        setFetchingPaints(Status.Finished);
      })
      .catch(() => setFetchingPaints(Status.Failed));
  } else {
    console.error("getAllPaints called but we already fetched paints");
  }
}

export function getPaintPointForTime(
  replayClient: ReplayClientInterface,
  time: number
): TimeStampedPointWithPaintHash {
  if (fetchingPaints === Status.NotStarted) {
    getAllPaints(replayClient);
  }
  if (fetchingPaints === Status.Finished || lastReceivedPaintPoint().time >= time) {
    return mostRecentEntry(receivedPaintPoints, time)!;
  }

  let request = mostRecentEntry(paintPointRequests, time);
  if (!request) {
    request = { wakeable: createWakeable(), time };
    insertEntrySorted(paintPointRequests, request);
  }
  throw request.wakeable;
}

export function imperitavelyGetPaintPointForTime(time: number) {
  return fetchingPaints === Status.Finished
    ? mostRecentEntry(receivedPaintPoints, time)
    : mostRecentContainedEntry(receivedPaintPoints, time);
}

export function imperitavelyGetNextPaintPointForTime(time: number) {
  return nextEntry(receivedPaintPoints, time);
}
