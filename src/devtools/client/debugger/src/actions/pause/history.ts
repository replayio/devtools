import { pauseHistoryDecremented, pauseHistoryIncremented } from "../../reducers/pause";
import { getPauseHistory, getPauseHistoryIndex } from "../../selectors";
import { seek } from "ui/actions/timeline";
import { UIThunkAction } from "ui/actions";

export function seekToPreviousPause(): UIThunkAction {
  return function (dispatch, getState) {
    const pauseHistory = getPauseHistory(getState());
    const pauseHistoryIndex = getPauseHistoryIndex(getState());

    const pause = pauseHistory[pauseHistoryIndex - 2];
    if (pause) {
      dispatch(pauseHistoryDecremented());
      dispatch(seek(pause.executionPoint, pause.time, pause.hasFrames, pause.pauseId));
    }
  };
}

export function seekToNextPause(): UIThunkAction {
  return function (dispatch, getState) {
    const pauseHistory = getPauseHistory(getState());
    const pauseHistoryIndex = getPauseHistoryIndex(getState());

    const pause = pauseHistory[pauseHistoryIndex + 1];
    if (pause) {
      dispatch(pauseHistoryIncremented());
      dispatch(seek(pause.executionPoint, pause.time, pause.hasFrames, pause.pauseId));
    }
  };
}
