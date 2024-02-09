import { useCallback, useContext, useLayoutEffect, useRef, useState } from "react";
import { Deferred, createDeferred } from "suspense";

import { waitForTime } from "protocol/utils";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { stopPlayback } from "ui/actions/timeline";
import { getPlayback, setTimelineState } from "ui/reducers/timeline";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

// When playing starts, this hook will listen for changes in cached screenshots/status and advance the playback time
// It's not enough to listen to the cache directly; the screenshot has to render and commit (be visible to the user)
export function useImperativeVideoPlayback(): [
  playbackTime: number | null,
  onCommitCallback: (time: number) => void
] {
  const replayClient = useContext(ReplayClientContext);
  const dispatch = useAppDispatch();

  const { beginDate, beginTime, endTime } = useAppSelector(getPlayback) ?? {};

  const [playbackTime, setPlaybackTime] = useState<number | null>(null);

  const committedTimesMapRef = useRef<Map<number | null, Deferred<void>>>(new Map());

  useLayoutEffect(() => {
    if (beginTime == null || beginDate == null || endTime == null) {
      return;
    }

    let previousTime = beginTime;
    let stop = false;

    const committedTimesMap = committedTimesMapRef.current;

    const playVideo = async () => {
      committedTimesMap.clear();

      while (true) {
        if (stop) {
          break;
        }

        const nextTime = Math.max(
          previousTime + 1,
          Math.min(endTime, beginTime + (Date.now() - beginDate))
        );

        previousTime = nextTime;

        dispatch(
          setTimelineState({
            currentTime: nextTime,
            playback: { beginTime, beginDate, endTime, time: nextTime },
          })
        );

        if (nextTime >= endTime) {
          dispatch(stopPlayback());
          break;
        } else {
          setPlaybackTime(nextTime);

          const deferred = createDeferred<void>();

          committedTimesMap.set(nextTime, deferred);

          await Promise.all([
            // If the screenshot nearest to the current time has already been cached,
            // we might end up with an immediate resolution here;
            // Since this is a while loop, we don't want to block the main thread.
            // So add some minimum amount of delay in here;
            // any amount should be okay but let's shoot for a 60fps
            waitForTime(16.7),
            Promise.race([
              // Wait until the Video component has loaded and displayed the next screenshot
              deferred.promise,
              // Give up and move on if it takes longer than 500ms for the snapshot to load
              waitForTime(250),
            ]),
          ]);
        }
      }
    };

    playVideo();

    return () => {
      stop = true;

      setPlaybackTime(null);
    };
  }, [beginDate, beginTime, dispatch, endTime, replayClient]);

  const onCommitCallback = useCallback((time: number | null) => {
    const deferred = committedTimesMapRef.current.get(time);
    if (deferred) {
      if (deferred.status === "pending") {
        deferred.resolve();
      } else {
        console.warn(`Already marked time ${time} as committed`);
      }
    }
  }, []);

  return [playbackTime, onCommitCallback];
}
