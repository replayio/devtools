import { FC } from "react";

import { UIThunkAction } from "ui/actions";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { replayAssistToggled, showReplayAssist as showReplayAssistSelector } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

function toggleAndShowAssistPanel(): UIThunkAction {
  return (dispatch, getState) => {
    dispatch(replayAssistToggled());
    const newValue = showReplayAssistSelector(getState());
    if (!newValue) {
      dispatch(setSelectedPrimaryPanel("events"));
    } else {
      dispatch(setSelectedPrimaryPanel("assist"));
    }
  };
}

const ReplayAssistButton: FC = () => {
  const { isAuthenticated } = useAuth0();
  const dispatch = useAppDispatch();
  const showReplayAssist = useAppSelector(showReplayAssistSelector);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="row row-flat rounded-none border-t border-b">
      <input
        type="checkbox"
        className="rounded-sm border-gray-400"
        id="replay-assist-checkbox"
        checked={showReplayAssist}
        onChange={() => {
          dispatch(toggleAndShowAssistPanel());
        }}
      />
      <span>Replay Assist</span>
    </div>
  );
};

export default ReplayAssistButton;
