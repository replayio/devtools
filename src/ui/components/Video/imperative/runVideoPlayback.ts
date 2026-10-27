import { ExecutionPoint } from "@replayio/protocol";

import { findMostRecentPaintIndex, mergedPaintsAndRepaints } from "protocol/PaintsCache";
import { screenshotCache } from "replay-next/src/suspense/ScreenshotCache";
import { ReplayClientInterface } from "shared/client/types";
import { seek, stopPlayback } from "ui/actions/timeline";
import { updateGraphics } from "ui/components/Video/imperative/updateGraphics";
import { getPlayback, setTimelineState } from "ui/reducers/timeline";
import { AppStore } from "ui/setup/store";
import { TimelineState } from "ui/state/timeline";

const SCREENSHOT_PREFETCH_LOOKAHEAD_MS = 3_000;
const MAX_SCREENSHOT_PREFETCHES_IN_FLIGHT = 5;

// Fetching the first screenshot of a region can take seconds (the backend may have to replay
// that region), so request upcoming screenshots before playback reaches them.
function prefetchScreenshots(replayClient: ReplayClientInterface, time: number, endTime: number) {
  const lookaheadEndTime = Math.min(endTime, time + SCREENSHOT_PREFETCH_LOOKAHEAD_MS);

  let inFlightCount = 0;
  for (
    let index = Math.max(0, findMostRecentPaintIndex(time));
    index < mergedPaintsAndRepaints.length;
    index++
  ) {
    const { paintHash, point, time: paintTime } = mergedPaintsAndRepaints[index];
    if (paintTime > lookaheadEndTime) {
      break;
    } else if (!paintHash) {
      continue;
    }

    const status = screenshotCache.getStatus(replayClient, point, paintHash);
    if (status === "pending") {
      inFlightCount++;
    } else if (status === "not-found" || status === "aborted") {
      if (inFlightCount >= MAX_SCREENSHOT_PREFETCHES_IN_FLIGHT) {
        break;
      }

      screenshotCache.prefetch(replayClient, point, paintHash);
      inFlightCount++;
    }
  }
}

export async function runVideoPlayback({
  abortSignal,
  beginPoint,
  beginTime,
  graphicsElement,
  endPoint,
  endTime,
  reduxStore,
  replayClient,
}: {
  abortSignal: AbortSignal;
  beginPoint: ExecutionPoint | null;
  beginTime: number;
  graphicsElement: HTMLElement;
  endPoint: ExecutionPoint | null;
  endTime: number;
  reduxStore: AppStore;
  replayClient: ReplayClientInterface;
}) {
  let previousDateNow = Date.now();
  let previousTimelineTime = beginTime;
  let playback: TimelineState["playback"] = null;

  playbackLoop: while (true) {
    const currentDateNow = Date.now();
    const elapsedTime = currentDateNow - previousDateNow;
    previousDateNow = currentDateNow;

    // Playback may have stalled waiting for graphics to load
    // We shouldn't jump too far ahead in the timeline, or it won't feel smooth
    // So cap the max amount of time we advance to 100ms
    const nextTimelineTimeMax = previousTimelineTime + 100;
    const nextTimelineTimeMin = previousTimelineTime + 10;
    const nextTimelineTime = Math.min(
      nextTimelineTimeMax,
      Math.max(nextTimelineTimeMin, Math.min(endTime, previousTimelineTime + elapsedTime))
    );
    previousTimelineTime = nextTimelineTime;

    playback = { beginPoint, beginTime, endPoint, endTime, time: nextTimelineTime };
    reduxStore.dispatch(setTimelineState({ currentTime: nextTimelineTime, playback }));

    if (nextTimelineTime >= endTime) {
      reduxStore.dispatch(stopPlayback());
      reduxStore.dispatch(seek({ executionPoint: endPoint || undefined, time: endTime }));

      break playbackLoop;
    } else {
      prefetchScreenshots(replayClient, nextTimelineTime, endTime);

      const updateGraphicsPromise = updateGraphics({
        abortSignal,
        graphicsElement,
        executionPoint: null,
        replayClient,
        time: nextTimelineTime,
      });

      // We may have already cached screenshot data, or we may be able to fetch it quickly
      // In order to avoid starving the rendering pipeline, wait a minimum amount of time before continuing
      // 16ms chosen because it allows an overall rate of 60fps
      await Promise.all([new Promise(resolve => setTimeout(resolve, 16)), updateGraphicsPromise]);

      if (abortSignal.aborted) {
        // Playback may have been paused and started again while this loop waited, and the new
        // playback belongs to another loop.
        if (getPlayback(reduxStore.getState()) === playback) {
          reduxStore.dispatch(stopPlayback());
        }

        break playbackLoop;
      }
    }
  }
}
