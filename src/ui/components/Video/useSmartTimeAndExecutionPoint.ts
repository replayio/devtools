import { useDeferredValue } from "react";

import { getExecutionPoint, getTime } from "devtools/client/debugger/src/selectors";
import {
  getCurrentTime,
  getHoverTime,
  getPlayback,
  getShowHoverTimeGraphics,
} from "ui/reducers/timeline";
import { useAppSelector } from "ui/setup/hooks";

export function useSmartTimeAndExecutionPoint() {
  const playback = useAppSelector(getPlayback);
  const hoverTime = useAppSelector(getHoverTime);
  const pauseExecutionPoint = useAppSelector(getExecutionPoint);
  const pauseTime = useAppSelector(getTime);
  const playbackTime = useAppSelector(getCurrentTime);
  const preferHoverTime = useAppSelector(getShowHoverTimeGraphics);
  const preferPlaybackTime = playback != null;

  let executionPoint: string | null = null;
  let time = 0;
  if (preferPlaybackTime) {
    time = playbackTime;
  } else if (hoverTime != null && preferHoverTime) {
    time = hoverTime;
  } else {
    time = pauseTime;
    executionPoint = pauseExecutionPoint;
  }

  return useDeferredValue({ executionPoint, time });
}
