import { useDispatch, useSelector } from "react-redux";
import { clearPendingComment } from "ui/actions/comments";
import { replayPlayback, startPlayback, stopPlayback } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { trackEvent } from "ui/utils/telemetry";
import { displayedEndForFocusRegion } from "ui/utils/timeline";

export default function PlayPauseButton() {
  const dispatch = useDispatch();
  const currentTime = useSelector(selectors.getCurrentTime);
  const focusRegion = useSelector(selectors.getFocusRegion);
  const playback = useSelector(selectors.getPlayback);
  const recordingDuration = useSelector(selectors.getRecordingDuration);

  const isAtEnd = focusRegion
    ? currentTime === displayedEndForFocusRegion(focusRegion)
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
    <button className="relative" onClick={onClick}>
      <div className="flex flex-row" style={{ width: "32px", height: "32px" }}>
        <img className="m-auto h-6 w-6" src={icon} />
      </div>
    </button>
  );
}
