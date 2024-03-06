import { createSingleEntryCache } from "suspense";

import { recordingTargetCache } from "replay-next/src/suspense/BuildIdCache";
import { screenshotCache } from "replay-next/src/suspense/ScreenshotCache";
import { find, findIndexGTE, findIndexLTE } from "replay-next/src/utils/array";
import { getDimensions } from "replay-next/src/utils/image";
import { replayClient } from "shared/client/ReplayClientContext";
import { TimeStampedPointWithPaintHash } from "shared/client/types";

// This could be a streaming cache, but streaming APIs are more awkward to interop with
// Since we wait for processing to complete before loading a recording, paints should always load very quickly
export const PaintsCache = createSingleEntryCache<[], TimeStampedPointWithPaintHash[] | null>({
  config: { immutable: true },
  debugLabel: "PaintsCache",
  load: async ([]) => {
    const target = await recordingTargetCache.readAsync(replayClient);
    switch (target) {
      case "node": {
        return null;
      }
    }

    return await replayClient.findPaints();
  },
});

export function findClosestPaint(time: number) {
  const paints = PaintsCache.getValueIfCached() ?? [];

  return find(paints, { paintHash: "", point: "", time }, (a, b) => a.time - b.time, false);
}

// The maximum number of paints to be considered when looking for the first meaningful paint
// TODO We should reconsider this metric; loading spinners make it useless
const INITIAL_PAINT_COUNT = 10;

export async function findFirstMeaningfulPaint() {
  const paints = await PaintsCache.readAsync();
  if (paints) {
    for (let index = 0; index < Math.min(paints.length, INITIAL_PAINT_COUNT); index++) {
      const paint = paints[index];

      try {
        const screenShot = paint.paintHash
          ? await screenshotCache.readAsync(replayClient, paint.point, paint.paintHash)
          : undefined;

        if (screenShot && screenShot.hash) {
          const { width, height } = await getDimensions(screenShot.hash, screenShot.mimeType);

          // Estimate how "interesting" the screen is based on what % of the image is different pixels.
          // This is done to avoid showing something like a blank page or a mostly empty loading screen.
          if (screenShot.data.length > (width * height) / 40) {
            return paint;
          }
        }
      } catch (error) {
        // Ignore
      }
    }
  }
}

export function findMostRecentPaint(time: number) {
  const paints = PaintsCache.getValueIfCached() ?? [];
  const index = findMostRecentPaintIndex(time);
  return index >= 0 ? paints[index] : null;
}

export function findMostRecentPaintIndex(time: number) {
  const paints = PaintsCache.getValueIfCached() ?? [];
  return findIndexLTE(paints, { time } as TimeStampedPointWithPaintHash, (a, b) => a.time - b.time);
}

export function findNextPaintEvent(time: number) {
  const paints = PaintsCache.getValueIfCached() ?? [];
  const index = findIndexGTE(
    paints,
    { time } as TimeStampedPointWithPaintHash,
    (a, b) => a.time - b.time
  );

  const paint = paints[index];
  if (paint && paint.time == time) {
    return index + 1 < paints.length ? paints[index + 1] : null;
  }

  return paint;
}

export function findPreviousPaintEvent(time: number) {
  const paint = findMostRecentPaint(time);
  if (paint && paint.time == time) {
    return findMostRecentPaint(time - 1);
  }
  return paint;
}
