import { replayPlayback, startPlayback, stopPlayback } from "ui/actions/timeline";
import { selectors } from "ui/reducers";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

export default function PlayPauseButton() {
  const dispatch = useAppDispatch();
  const currentTime = useAppSelector(selectors.getCurrentTime);
  const displayedFocusRegion = useAppSelector(selectors.getDisplayedFocusRegion);
  const playback = useAppSelector(selectors.getPlayback);
  const recordingDuration = useAppSelector(selectors.getRecordingDuration);

  const isAtEnd = displayedFocusRegion
    ? currentTime === displayedFocusRegion.end
    : currentTime == recordingDuration;

  let onClick;
  let icon;
  if (isAtEnd) {
    icon = "/images/playback-refresh.svg";
    onClick = () => {
      trackEvent("timeline.replay");
      dispatch(replayPlayback());
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
    <button className="relative" onClick={onClick}>
      <div className="flex flex-row" style={{ width: "32px", height: "32px" }}>
        <img className="m-auto h-6 w-6" src={icon} />
      </div>
    </button>
  );
}
