import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { setShowReplayAssist, showReplayAssist as showReplayAssistSelector } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

export default function ReplayAssistButton() {
  const dispatch = useAppDispatch();
  const showReplayAssist = useAppSelector(showReplayAssistSelector);

  const { isAuthenticated } = useAuth0();
  if (!isAuthenticated) {
    return null;
  }

  const onChange = () => {
    const newValue = !showReplayAssist;
    dispatch(setShowReplayAssist(newValue));
    if (!newValue) {
      dispatch(setSelectedPrimaryPanel("events"));
    } else {
      dispatch(setSelectedPrimaryPanel("assist"));
    }
  };

  return (
    <div className="row row-flat rounded-none border-t border-b">
      <input
        type="checkbox"
        className="rounded-sm border-gray-400"
        id="replay-assist-checkbox"
        checked={showReplayAssist}
        onChange={onChange}
      />
      <span>Replay Assist</span>
    </div>
  );
}
