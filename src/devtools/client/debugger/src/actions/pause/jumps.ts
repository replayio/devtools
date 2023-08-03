import { UIThunkAction } from "ui/actions";
import { seek } from "ui/actions/timeline";

import { pauseHistoryDecremented, pauseHistoryIncremented } from "../../reducers/pause";
import { getPauseHistory, getPauseHistoryIndex } from "../../selectors";

export function jumpToPreviousPause(): UIThunkAction {
  return (dispatch, getState) => {
    const pauseHistory = getPauseHistory(getState());
    const pauseHistoryIndex = getPauseHistoryIndex(getState());
    if (pauseHistoryIndex !== 0) {
      const pause = pauseHistory[pauseHistoryIndex - 1];
      if (pause) {
        dispatch(pauseHistoryDecremented());
        dispatch(
          seek({
            executionPoint: pause.executionPoint,
            openSource: pause.hasFrames,
            pauseId: pause.pauseId,
            time: pause.time,
          })
        );
      }
    }
  };
}

export function jumpToNextPause(): UIThunkAction {
  return (dispatch, getState) => {
    const pauseHistory = getPauseHistory(getState());
    const pauseHistoryIndex = getPauseHistoryIndex(getState());
    if (pauseHistoryIndex !== pauseHistory.length) {
      const pause = pauseHistory[pauseHistoryIndex + 1];
      if (pause) {
        dispatch(pauseHistoryIncremented());
        dispatch(
          seek({
            executionPoint: pause.executionPoint,
            openSource: pause.hasFrames,
            pauseId: pause.pauseId,
            time: pause.time,
          })
        );
      }
    }
  };
}
