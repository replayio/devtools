import React, { FC, useEffect, useState } from "react";

import useLocalStorage from "replay-next/src/hooks/useLocalStorage";
import { UIThunkAction } from "ui/actions";
import { setSelectedPrimaryPanel } from "ui/actions/layout";
import { getReplayAssist, replayAssistToggled } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import useAuth0 from "ui/utils/useAuth0";

function toggleAndShowAssistPanel(): UIThunkAction {
  return (dispatch, getState) => {
    dispatch(replayAssistToggled());
    const newValue = getReplayAssist(getState());
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
  const shouldShowReplayAssist = useAppSelector(getReplayAssist);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="border-t border-b rounded-none row row-flat">
      <input
        type="checkbox"
        className="border-gray-400 rounded-sm"
        id="replay-assist-checkbox"
        checked={shouldShowReplayAssist}
        onChange={() => {
          dispatch(toggleAndShowAssistPanel());
        }}
      />
      <span>Replay Assist</span>
    </div>
  );
};

export default ReplayAssistButton;
