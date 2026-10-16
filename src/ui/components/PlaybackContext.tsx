import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef } from "react";

import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { runVideoPlayback } from "ui/components/Video/imperative/runVideoPlayback";
import { getPlayback } from "ui/reducers/timeline";
import { useAppStore } from "ui/setup/hooks";

export type PlaybackContextType = {
  // Playback waits for each frame to be drawn in the registered element; without one (e.g. recordings
  // without graphics) it only advances the time.
  registerGraphicsElement: (graphicsElement: HTMLElement) => () => void;
};

export const PlaybackContext = createContext<PlaybackContextType>(null as any);

export function PlaybackContextRoot({ children }: PropsWithChildren<{}>) {
  const reduxStore = useAppStore();
  const replayClient = useContext(ReplayClientContext);

  const graphicsElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let abortController: AbortController | null = null;

    const update = () => {
      const playback = getPlayback(reduxStore.getState());

      if (playback == null) {
        abortController?.abort();
        abortController = null;
      } else if (abortController == null) {
        abortController = new AbortController();

        runVideoPlayback({
          abortSignal: abortController.signal,
          beginPoint: playback.beginPoint,
          beginTime: playback.beginTime,
          endPoint: playback.endPoint,
          endTime: playback.endTime,
          getGraphicsElement: () => graphicsElementRef.current,
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
  }, [reduxStore, replayClient]);

  const context = useMemo<PlaybackContextType>(
    () => ({
      registerGraphicsElement: (graphicsElement: HTMLElement) => {
        graphicsElementRef.current = graphicsElement;

        return () => {
          if (graphicsElementRef.current === graphicsElement) {
            graphicsElementRef.current = null;
          }
        };
      },
    }),
    []
  );

  return <PlaybackContext.Provider value={context}>{children}</PlaybackContext.Provider>;
}
