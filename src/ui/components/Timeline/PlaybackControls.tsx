import { motion } from "framer-motion";
import { useContext, useEffect } from "react";

import { recordingCapabilitiesCache } from "replay-next/src/suspense/BuildIdCache";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { replayFromBeginning, startPlayback, stopPlayback } from "ui/actions/timeline";
import { subscribeToPlaybackWithoutGraphics } from "ui/components/Timeline/subscribeToPlaybackWithoutGraphics";
import { selectors } from "ui/reducers";
import { getViewMode } from "ui/reducers/layout";
import { useAppDispatch, useAppSelector, useAppStore } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

export default function PlayPauseButton() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const focusWindow = useAppSelector(selectors.getFocusWindow);
  const playback = useAppSelector(selectors.getPlayback);
  const recordingDuration = useAppSelector(selectors.getRecordingDuration);
  const reduxStore = useAppStore();
  const replayClient = useContext(ReplayClientContext);
  const viewMode = useAppSelector(getViewMode);

  useEffect(() => {
    // The viewer mode always shows <Video />.
    if (viewMode !== "dev") {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let unmounted = false;

    (async () => {
      const { supportsRepaintingGraphics } = await recordingCapabilitiesCache.readAsync(
        replayClient
      );
      if (!supportsRepaintingGraphics && !unmounted) {
        unsubscribe = subscribeToPlaybackWithoutGraphics({ reduxStore, replayClient });
      }
    })();

    return () => {
      unmounted = true;
      unsubscribe?.();
    };
  }, [reduxStore, replayClient, viewMode]);

  const isAtEnd = focusWindow ? currentTime === focusWindow.end : currentTime == recordingDuration;

  let onClick;
  let icon;
  if (isAtEnd) {
    icon = "/recording/images/playback-refresh.svg";
    onClick = () => {
      trackEvent("timeline.replay");
      dispatch(replayFromBeginning());
    };
  } else if (playback) {
    icon = "/recording/images/playback-pause.svg";
    onClick = () => {
      trackEvent("timeline.pause");
      dispatch(stopPlayback());
    };
  } else {
    icon = "/recording/images/playback-play.svg";
    onClick = () => {
      trackEvent("timeline.play");
      dispatch(startPlayback());
    };
  }

  return (
    <div className="flex flex-row" style={{ width: "24px", height: "32px" }} onClick={onClick}>
      <motion.img
        className="m-auto h-6 w-6 rounded-full hover:cursor-pointer"
        src={icon}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 1.0, boxShadow: "0px 0px 1px rgba(0,0,0,0.2)" }}
        transition={{ duration: 0.05 }}
      />
    </div>
  );
}
