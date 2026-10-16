import { ReplayClientInterface } from "shared/client/types";
import { runVideoPlayback } from "ui/components/Video/imperative/runVideoPlayback";
import { getPlayback } from "ui/reducers/timeline";
import { AppStore } from "ui/setup/store";

// Recordings without graphics (e.g. Node) have no <Video />, whose subscription otherwise runs playback.
// The playback loop is stopped from the Redux subscription so that it can't advance the time after a pause.
export function subscribeToPlaybackWithoutGraphics({
  reduxStore,
  replayClient,
}: {
  reduxStore: AppStore;
  replayClient: ReplayClientInterface;
}) {
  let abortController: AbortController | null = null;

  const update = () => {
    const playbackState = getPlayback(reduxStore.getState());

    if (playbackState == null) {
      abortController?.abort();
      abortController = null;
    } else if (abortController == null) {
      abortController = new AbortController();

      runVideoPlayback({
        abortSignal: abortController.signal,
        beginPoint: playbackState.beginPoint,
        beginTime: playbackState.beginTime,
        graphicsElement: null,
        endPoint: playbackState.endPoint,
        endTime: playbackState.endTime,
        reduxStore,
        replayClient,
      });
    }
  };

  const unsubscribeFromReduxStore = reduxStore.subscribe(update);

  update();

  return () => {
    abortController?.abort();

    unsubscribeFromReduxStore();
  };
}
