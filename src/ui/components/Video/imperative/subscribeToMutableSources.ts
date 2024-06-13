import { ExecutionPoint } from "@replayio/protocol";

import { ReplayClientInterface } from "shared/client/types";
import { getGraphicsTimeAndExecutionPoint } from "ui/components/Video/imperative/getGraphicsTimeAndExecutionPoint";
import { updateState } from "ui/components/Video/imperative/MutableGraphicsState";
import { repositionGraphicsOverlayElements } from "ui/components/Video/imperative/repositionGraphicsOverlayElements";
import { runVideoPlayback } from "ui/components/Video/imperative/runVideoPlayback";
import { updateGraphics } from "ui/components/Video/imperative/updateGraphics";
import { getPlayback } from "ui/reducers/timeline";
import { AppStore } from "ui/setup/store";

export function subscribeToMutableSources({
  containerElement,
  graphicsElement,
  graphicsOverlayElement,
  reduxStore,
  replayClient,
}: {
  containerElement: HTMLElement;
  graphicsElement: HTMLImageElement;
  graphicsOverlayElement: HTMLElement;
  reduxStore: AppStore;
  replayClient: ReplayClientInterface;
}) {
  let abortController: AbortController | null = null;
  let prevTime: number | null = null;
  let prevExecutionPoint: ExecutionPoint | null = null;
  let prevIsPlaying = false;

  const resizeObserver = new ResizeObserver(() => {
    repositionGraphicsOverlayElements({
      containerElement,
      graphicsElement,
      graphicsOverlayElement,
    });

    // When the graphics element resizes, the mutable state should recalculate the its layout
    updateState(graphicsElement, { didResize: true });
  });

  resizeObserver.observe(containerElement);
  resizeObserver.observe(graphicsElement);

  const update = () => {
    const state = reduxStore.getState();

    const playbackState = getPlayback(state);

    const isPlaying = playbackState != null;

    const { executionPoint, time } = getGraphicsTimeAndExecutionPoint(
      state,
      replayClient.getCurrentFocusWindow()
    );

    if (prevExecutionPoint === executionPoint && prevIsPlaying === isPlaying && prevTime === time) {
      // Ignore Redux updates that aren't relevant to graphics state
      return;
    }

    const didStartPlaying = isPlaying && !prevIsPlaying;

    prevTime = time;
    prevExecutionPoint = executionPoint;
    prevIsPlaying = isPlaying;

    if (isPlaying) {
      if (didStartPlaying) {
        if (abortController != null) {
          abortController.abort();
          abortController = null;
        }

        abortController = new AbortController();

        runVideoPlayback({
          abortSignal: abortController.signal,
          beginPoint: playbackState.beginPoint,
          beginTime: playbackState.beginTime,
          graphicsElement,
          endPoint: playbackState.endPoint,
          endTime: playbackState.endTime,
          reduxStore,
          replayClient,
        });
      }
    } else {
      if (abortController != null) {
        abortController.abort();
        abortController = null;
      }

      abortController = new AbortController();

      updateGraphics({
        abortSignal: abortController.signal,
        graphicsElement,
        executionPoint,
        replayClient,
        time,
      });
    }
  };

  const unsubscribeFromReduxStore = reduxStore.subscribe(update);

  update();

  return () => {
    if (abortController != null) {
      abortController.abort();
    }

    unsubscribeFromReduxStore();

    resizeObserver.disconnect();
  };
}
