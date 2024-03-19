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

  const promises: Promise<ScreenShot | undefined>[] = [];

  // If the current time is before the first paint, we should show nothing
  const paintPoint = findMostRecentPaint(time);
  const isBeforeFirstCachedPaint = !paintPoint || !paintPoint.paintHash;
  if (isBeforeFirstCachedPaint) {
    updateState(containerElement, {
      executionPoint,
      screenShot: null,
      screenShotType: null,
      status: executionPoint ? "loading" : "loaded",
      time,
    });
  } else {
    promises.push(
      fetchPaintContents({
        abortSignal,
        containerElement,
        replayClient,
        time,
      })
    );
  }

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

  if (promises.length === 0) {
    // If we are before the first paint and have no execution point to request a repaint,
    // then we should clear out the currently visible graphics and bail out
    return;
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
      screenShotType: repaintGraphicsScreenShot != null ? "repaint" : "cached-paint",
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
        screenShotType: "repaint",
        status: "loaded",
        time,
      });

      return;
    }
  }

  if (screenShot == null) {
    // If we couldn't load either a cached screenshot or a repaint, update the DOM to reflect that
    updateState(containerElement, {
      executionPoint,
      screenShotType: null,
      status: isBeforeFirstCachedPaint ? "loaded" : "failed",
      time,
    });
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

  // Until repaints are more reliable, only wait a few seconds before giving up
  // this prevents the UI from getting stuck in a visible loading state
  const timeoutPromise = new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, 5_000);
  });

  let screenShot: ScreenShot | undefined = undefined;

  try {
    const repaintPromise = RepaintGraphicsCache.readAsync(replayClient, pauseId);

    await Promise.race([repaintPromise, timeoutPromise]).then(result => {
      screenShot = result?.screenShot;
    });
  } catch (error) {
    // Repaint graphics are currently expected to fail
  }

  return screenShot;
}
