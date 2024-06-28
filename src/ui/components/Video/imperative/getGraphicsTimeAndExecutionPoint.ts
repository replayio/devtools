import { TimeStampedPointRange } from "@replayio/protocol";

import { getExecutionPoint, getTime } from "devtools/client/debugger/src/selectors";
import { isTimeInRegion } from "shared/utils/time";
import {
  getCurrentTime,
  getHoverTime,
  getPlayback,
  getShowHoverTimeGraphics,
} from "ui/reducers/timeline";
import { UIState } from "ui/state";

export function getGraphicsTimeAndExecutionPoint(
  state: UIState,
  focusWindow: TimeStampedPointRange | null
) {
  const playbackState = getPlayback(state);
  const hoverTime = getHoverTime(state);
  const preferHoverTime = getShowHoverTimeGraphics(state);
  const pauseExecutionPoint = getExecutionPoint(state);
  const pauseTime = getTime(state);
  const currentTime = getCurrentTime(state);

  const isHovering = hoverTime != null && preferHoverTime;
  const isPlaying = playbackState != null;

  if (isHovering && !isPlaying) {
    return { executionPoint: null, time: hoverTime };
  }

  let preferCurrentTime = false;
  if (isPlaying) {
    preferCurrentTime = true;
  } else if (
    focusWindow &&
    !isTimeInRegion(currentTime, focusWindow) &&
    Math.abs(pauseTime - currentTime) > 0.05
  ) {
    // The "current time" represents the time shown on the Timeline
    // This is the time the user sets when scrubbing the timeline as well as when playback is active
    //
    // The "pause time" is a higher-fidelity version of the current time
    // It is often accompanied by an execution point and a pause id (which can be used to inspect values in the debugger)
    //
    // When possible, it is better to use the "pause time" for displaying graphics
    // because it enables us to display a more up-to-date screenshot from DOM.repaintGraphics
    //
    // There are situations where we should not use this value though
    // For instance, if the user scrubs the timeline outside of the focus window, a Pause can't be created
    // In that case, we should show the lower-fidelity playback time so the screenshot and timeline line up
    //
    // A heuristic for detecting this case is comparing how close the two values are
    // However, this heuristic should only apply if the "current time" is outside of the focus window,
    // else it might prevent us from updating the graphics when the user seeks between two cached paint points
    preferCurrentTime = true;
  }

  if (preferCurrentTime) {
    return { executionPoint: null, time: currentTime };
  } else {
    return { executionPoint: pauseExecutionPoint, time: pauseTime };
  }
}
