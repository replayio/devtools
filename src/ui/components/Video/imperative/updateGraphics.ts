import { ExecutionPoint, ScreenShot } from "@replayio/protocol";

import { PaintsCache, findMostRecentPaint } from "protocol/PaintsCache";
import { RepaintGraphicsCache } from "protocol/RepaintGraphicsCache";
import { pauseIdCache } from "replay-next/src/suspense/PauseCache";
import { screenshotCache } from "replay-next/src/suspense/ScreenshotCache";
import { ReplayClientInterface } from "shared/client/types";
import { updateState } from "ui/components/Video/imperative/MutableGraphicsState";

export async function updateGraphics({
  abortSignal,
  containerElement,
  executionPoint,
  replayClient,
  time,
}: {
  abortSignal: AbortSignal;
  containerElement: HTMLElement;
  executionPoint: ExecutionPoint | null;
  time: number;
  replayClient: ReplayClientInterface;
}) {
  updateState(containerElement, {
    executionPoint,
    status: "loading",
    time,
  });

  await PaintsCache.readAsync();
  if (abortSignal.aborted) {
    return;
  }

  // If the current time is before the first paint, we should show nothing
  const paintPoint = findMostRecentPaint(time);
  if (!paintPoint || !paintPoint.paintHash) {
    updateState(containerElement, {
      executionPoint,
      screenShot: null,
      status: "loaded",
      time,
    });
    return;
  }

  const promises: Promise<ScreenShot | undefined>[] = [
    fetchPaintContents({
      abortSignal,
      containerElement,
      replayClient,
      time,
    }),
  ];

  let repaintGraphicsScreenShot: ScreenShot | undefined = undefined;
  if (executionPoint) {
    const promise = fetchRepaintGraphics({
      executionPoint,
      replayClient,
      time,
    }).then(screenShot => {
      repaintGraphicsScreenShot = screenShot;

      return screenShot;
    });

    promises.push(promise);
  }

  // Fetch paint contents and repaint graphics in parallel
  const screenShot = await Promise.race(promises);
  if (abortSignal.aborted) {
    return;
  }

  // Show the first screenshot we get back (if we've found one)
  if (screenShot != null) {
    updateState(containerElement, {
      executionPoint,
      screenShot,
      status: "loaded",
      time,
    });

    if (repaintGraphicsScreenShot != null) {
      // If the repaint graphics promise finished first, we can bail out
      // this is guaranteed to be the more up-to-date screenshot
      return true;
    }
  }

  if (executionPoint) {
    // Otherwise wait until the repaint graphics promise finishes
    await Promise.all(promises);
    if (abortSignal.aborted) {
      return;
    }

    if (repaintGraphicsScreenShot != null) {
      // The repaint graphics API fails a lot; it should fail quietly here
      updateState(containerElement, {
        executionPoint,
        screenShot: repaintGraphicsScreenShot,
        status: "loaded",
        time,
      });
    }
  }
}

async function fetchPaintContents({
  abortSignal,
  containerElement,
  replayClient,
  time,
}: {
  abortSignal: AbortSignal;
  containerElement: HTMLElement;
  time: number;
  replayClient: ReplayClientInterface;
}): Promise<ScreenShot | undefined> {
  const paintPoint = findMostRecentPaint(time);
  if (!paintPoint || !paintPoint.paintHash) {
    // Don't try to paint (or repaint) if the current time is before the first cached paint
    return undefined;
  }

  try {
    return await screenshotCache.readAsync(replayClient, paintPoint.point, paintPoint.paintHash);
  } catch (error) {
    if (abortSignal.aborted) {
      return;
    }

    updateState(containerElement, {
      status: "failed",
    });
  }
}

async function fetchRepaintGraphics({
  executionPoint,
  replayClient,
  time,
}: {
  executionPoint: ExecutionPoint;
  time: number;
  replayClient: ReplayClientInterface;
}): Promise<ScreenShot | undefined> {
  const pauseId = await pauseIdCache.readAsync(replayClient, executionPoint, time);

  try {
    const result = await RepaintGraphicsCache.readAsync(replayClient, pauseId);

    return result?.screenShot;
  } catch (error) {
    // Repaint graphics are currently expected to fail
  }
}
