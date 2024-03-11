import { motion } from "framer-motion";

import { replayFromBeginning, startPlayback, stopPlayback } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

export default function PlayPauseButton() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const focusWindow = useAppSelector(selectors.getFocusWindow);
  const playback = useAppSelector(selectors.getPlayback);
  const recordingDuration = useAppSelector(selectors.getRecordingDuration);

  const isAtEnd = focusWindow ? currentTime === focusWindow.end : currentTime == recordingDuration;

  let onClick;
  let icon;
  if (isAtEnd) {
    icon = "/images/playback-refresh.svg";
    onClick = () => {
      trackEvent("timeline.replay");
      dispatch(replayFromBeginning());
    };
  } else if (playback) {
    icon = "/images/playback-pause.svg";
    onClick = () => {
      trackEvent("timeline.pause");
      dispatch(stopPlayback());
    };
  } else {
    icon = "/images/playback-play.svg";
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
