import React, { FC, useState } from "react";
import { useDispatch } from "react-redux";

import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { toggleReplayAssist } from "ui/reducers/app"; // Make sure to import this action
import useAuth0 from "ui/utils/useAuth0";

const ReplayAssistButton: FC = () => {
  const { isAuthenticated } = useAuth0();
  const [shouldShowReplayAssist, setShouldShowReplayAssist] = useState(false);

  const dispatch = useDispatch();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="row row-flat rounded-none border-t border-b">
      <input
        type="checkbox"
        className="rounded-sm border-gray-400"
        id="replay-assist-checkbox"
        checked={shouldShowReplayAssist}
        onChange={() => {
          setShouldShowReplayAssist(!shouldShowReplayAssist);
          dispatch(toggleReplayAssist());
          if (shouldShowReplayAssist) {
            dispatch(setSelectedPrimaryPanel("events"));
          } else {
            dispatch(setSelectedPrimaryPanel("assist"));
          }
        }}
      />
      <span>Replay Assist</span>
    </div>
  );
};

export default ReplayAssistButton;
