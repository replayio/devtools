import { ExecutionPoint } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";
import { seek, stopPlayback } from "ui/actions/timeline";
import { updateGraphics } from "ui/components/Video/imperative/updateGraphics";
import { setTimelineState } from "ui/reducers/timeline";
import { AppStore } from "ui/setup/store";

export async function runVideoPlayback({
  abortSignal,
  beginPoint,
  beginTime,
  containerElement,
  endPoint,
  endTime,
  reduxStore,
  replayClient,
}: {
  abortSignal: AbortSignal;
  beginPoint: ExecutionPoint | null;
  beginTime: number;
  containerElement: HTMLElement;
  endPoint: ExecutionPoint | null;
  endTime: number;
  reduxStore: AppStore;
  replayClient: ReplayClientInterface;
}) {
  let previousDateNow = Date.now();
  let previousTimelineTime = beginTime;

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

    reduxStore.dispatch(
      setTimelineState({
        currentTime: nextTimelineTime,
        playback: { beginPoint, beginTime, endPoint, endTime, time: nextTimelineTime },
      })
    );

    if (nextTimelineTime >= endTime) {
      reduxStore.dispatch(stopPlayback());
      reduxStore.dispatch(seek({ executionPoint: endPoint || undefined, time: endTime }));

      break playbackLoop;
    } else {
      const updateGraphicsPromise = updateGraphics({
        abortSignal,
        containerElement,
        executionPoint: null,
        replayClient,
        time: nextTimelineTime,
      });

      // We may have already cached screenshot data, or we may be able to fetch it quickly
      // In order to avoid starving the rendering pipeline, wait a minimum amount of time before continuing
      // 16ms chosen because it allows an overall rate of 60fps
      await Promise.all([new Promise(resolve => setTimeout(resolve, 16)), updateGraphicsPromise]);

      if (abortSignal.aborted) {
        reduxStore.dispatch(stopPlayback());

        break playbackLoop;
      }
    }
  }
}
