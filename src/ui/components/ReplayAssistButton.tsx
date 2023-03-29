import React, { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { toggleReplayAssist } from "ui/reducers/app";
import useAuth0 from "ui/utils/useAuth0";

const ReplayAssistButton: FC = () => {
  const { isAuthenticated } = useAuth0();
  const dispatch = useDispatch();
  const [shouldShowReplayAssist, setShouldShowReplayAssist] = useLocalStorage<boolean>(
    `Replay:replayAssistEnabled`,
    false
  );

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
          const newValue = !shouldShowReplayAssist;
          setShouldShowReplayAssist(newValue);
          dispatch(toggleReplayAssist());
          if (!newValue) {
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
