/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { getFramesAsync } from "bvaughn-architecture-demo/src/suspense/FrameCache";
import type { UIThunkAction } from "ui/actions";
import { isPointInLoadingRegion } from "ui/reducers/app";
import { getSelectedLocation } from "ui/reducers/sources";
import { trackEvent } from "ui/utils/telemetry";

import {
  frameSelected,
  pauseCreationFailed,
  pauseRequestedAt,
  paused as pausedAction,
} from "../../reducers/pause";
import { getThreadContext } from "../../selectors";
import { getSelectedFrameAsync } from "../../selectors/pause";

type $FixTypeLater = any;

export function paused({
  executionPoint,
  hasFrames,
  frame,
  time,
}: {
  executionPoint: string;
  hasFrames?: boolean;
  frame?: $FixTypeLater;
  time?: number;
}): UIThunkAction {
  return async function (dispatch, getState, { ThreadFront, replayClient }) {
    dispatch(pauseRequestedAt());

    if (!isPointInLoadingRegion(getState(), executionPoint)) {
      dispatch(pauseCreationFailed(executionPoint));
    }

    trackEvent("paused");

    const pause = ThreadFront.getCurrentPause();

    await pause.createWaiter;

    dispatch(pausedAction({ executionPoint, time, id: pause.pauseId!, frame }));

    const cx = getThreadContext(getState());

    try {
      await pause.createWaiter;
    } catch (e) {
      console.error(e);
      dispatch(pauseCreationFailed(executionPoint));
      return;
    }

    // `ThreadFront.timeWarp()` receives a `hasFrames` flag.
    // This is sometimes derived from an initial pause point or comment.
    // However, `seekToTime()` explicitly sets that flag to `false`.
    // Previously, that resulted in fetch logic in `ThreadFront.getFrames()` bailing out early
    // and returning an empty frames array, so no frame would be marked as selected,
    // and thus user clicks on the timeline never resulted in a file being opened even
    // if there really _were_ frames at that specific point.
    // Now, we mimic that behavior by bailing out early if the passed-through `hasFrames` flag is false.
    // Yes, this means that `hasFrames` is a misleading name and we should fix that.
    const frames = await getFramesAsync(replayClient, pause.pauseId!);
    if (!frames?.length) {
      return;
    }

    dispatch(frameSelected({ cx, pauseId: pause.pauseId!, frameId: frames[0].frameId }));

    if (hasFrames === false) {
      return;
    }

    const selectedFrame = frame || (await getSelectedFrameAsync(replayClient, getState()));
    if (selectedFrame) {
      const currentLocation = getSelectedLocation(getState());
      if (
        !currentLocation ||
        currentLocation.sourceId !== selectedFrame.location.sourceId ||
        currentLocation.line !== selectedFrame.location.line ||
        currentLocation.column !== selectedFrame.location.column
      ) {
        const { selectLocation } = await import("../sources");
        dispatch(selectLocation(cx, selectedFrame.location, true));
      }

      if (pause !== ThreadFront.currentPause) {
        return;
      }
    }
  };
}
