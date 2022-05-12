import { useDispatch, useSelector } from "react-redux";
import { clearPendingComment } from "ui/actions/comments";
import { replayPlayback, startPlayback, stopPlayback } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { features } from "ui/utils/prefs";
import { trackEvent } from "ui/utils/telemetry";

import IndexingLoader from "../shared/IndexingLoader";

export default function PlayPauseButton() {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectors.getCurrentTime);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const playback = useSelector(selectors.getPlayback);
  const recordingDuration = useSelector(selectors.getRecordingDuration);
  const videoUrl = useSelector(selectors.getVideoUrl);

  const disabled = !videoUrl && (features.videoPlayback as boolean);
  const isAtEnd = focusRegion
    ? currentTime === focusRegion.endTime
    : currentTime == recordingDuration;

  let onClick;
  let icon;
  if (isAtEnd) {
    icon = "/images/playback-refresh.svg";
    onClick = () => {
      trackEvent("timeline.replay");
      dispatch(clearPendingComment());
      dispatch(replayPlayback());
    };
  } else if (playback) {
    icon = "/images/playback-pause.svg";
    onClick = () => {
      trackEvent("timeline.pause");
      dispatch(clearPendingComment());
      dispatch(stopPlayback());
    };
  } else {
    icon = "/images/playback-play.svg";
    onClick = () => {
      trackEvent("timeline.play");
      dispatch(clearPendingComment());
      dispatch(startPlayback());
    };
  }

  return (
    <button className="relative" onClick={onClick} disabled={disabled}>
      <IndexingLoader />
      <div className="flex flex-row" style={{ width: "32px", height: "32px" }}>
        <img className="m-auto h-6 w-6" src={icon} />
      </div>
    </button>
  );
}
