/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import { PauseId } from "@replayio/protocol";

import { framesCache } from "replay-next/src/suspense/FrameCache";
import { isPointInRegion } from "shared/utils/time";
import type { UIThunkAction } from "ui/actions";
import { getSelectedLocation } from "ui/reducers/sources";
import { getCurrentPauseId } from "ui/utils/app";
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
  openSource,
  frame,
  time,
}: {
  executionPoint: string;
  openSource: boolean;
  frame?: $FixTypeLater;
  time: number;
}): UIThunkAction {
  return async function (dispatch, getState, { replayClient }) {
    dispatch(pauseRequestedAt({ executionPoint, time }));

    const focusWindow = await replayClient.getCurrentFocusWindow();

    if (focusWindow === null || !isPointInRegion(executionPoint, focusWindow)) {
      dispatch(pauseCreationFailed(executionPoint));
    }

    trackEvent("paused");

    let pauseId: PauseId;
    try {
      pauseId = await getCurrentPauseId(replayClient, getState());
    } catch (e) {
      console.error(e);
      dispatch(pauseCreationFailed(executionPoint));
      return;
    }

    dispatch(pausedAction({ executionPoint, time, id: pauseId, frame }));

    const cx = getThreadContext(getState());

    const frames = await framesCache.readAsync(replayClient, pauseId);
    if (!frames?.length) {
      return;
    }

    dispatch(frameSelected({ cx, pauseId, frameId: frames[0].frameId }));

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
        dispatch(selectLocation(cx, selectedFrame.location, openSource));
      }
    }
  };
}
